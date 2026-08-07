import { CRAWL_STATES } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { syncRunCounts } from "./crawl-run.js";
import { CRAWL_EVENTS } from "./crawl-state.js";
import { createFetchRecord } from "./fetch-record.js";
import { fetchHtmlPage } from "./fetcher.js";
import { discoverPageLinks } from "./link-discovery.js";
import { appendProgressEvent, PROGRESS_EVENT_TYPES } from "./progress-events.js";
import { createPriorityTaskQueue } from "./priority-task-queue.js";
import { applyRunTransition } from "./state-transition.js";
import { createTaskRecord, TASK_STATES } from "./task-record.js";
import { inspectUrl } from "./url-intelligence.js";

function withEvent(snapshot, type, payload, now) {
  const appended = appendProgressEvent(snapshot.run, snapshot.events, type, payload, now);
  if (!appended.ok) return appended;
  return success({ ...snapshot, run: appended.value.run, events: appended.value.events, lastEvent: appended.value.event });
}

function syncCounts(snapshot, queue, now) {
  const synced = syncRunCounts(snapshot.run, queue.counts(), now);
  if (!synced.ok) return synced;
  return success({ ...snapshot, run: synced.value, queue: queue.snapshot() });
}

function registryFor(queue) {
  return {
    has: key => queue.hasCanonicalKey(key),
    getState: key => queue.snapshot().tasks.find(task => task.canonicalKey === key)?.state ?? null
  };
}

function retryDelay(config, task, errorDetails = {}) {
  const explicit = Number.isFinite(errorDetails.retryAfterMs) ? errorDetails.retryAfterMs : 0;
  const exponential = Math.min(60_000, Math.max(250, config.requestDelayMs || 0) * (2 ** task.attempt));
  return Math.max(config.requestDelayMs || 0, explicit, exponential);
}

function nextQueuedDelay(queueSnapshot, now) {
  const times = queueSnapshot.tasks
    .filter(task => task.state === TASK_STATES.QUEUED)
    .map(task => task.availableAt)
    .filter(value => Number.isSafeInteger(value));
  if (times.length === 0) return null;
  return Math.max(0, Math.min(...times) - now);
}

async function finalizeNetworkStage(snapshot, persistSnapshot, now) {
  let next = structuredClone(snapshot);
  let moved = applyRunTransition(next.run, CRAWL_EVENTS.BEGIN_FINALIZE, now);
  if (!moved.ok) return moved;
  next.run = moved.value;
  let event = withEvent(next, PROGRESS_EVENT_TYPES.FINALIZATION_STARTED, { stage: "FETCH_DISCOVERY" }, now);
  if (!event.ok) return event;
  next = event.value;
  moved = applyRunTransition(next.run, CRAWL_EVENTS.COMPLETE, now);
  if (!moved.ok) return moved;
  next.run = moved.value;
  event = withEvent(next, PROGRESS_EVENT_TYPES.CRAWL_COMPLETED, { stage: "FETCH_DISCOVERY" }, now);
  if (!event.ok) return event;
  next = event.value;
  const persisted = await persistSnapshot(next);
  return persisted.ok ? success({ snapshot: persisted.value, action: "COMPLETE", shouldContinue: false, nextDelayMs: null }) : persisted;
}

export async function processNextNetworkTask(snapshot, dependencies = {}) {
  if (!snapshot?.config || !snapshot?.run || !snapshot?.queue) {
    return failure("INVALID_CRAWL_SNAPSHOT", "Network crawler requires a valid crawl snapshot");
  }
  if (snapshot.run.lifecycle !== CRAWL_STATES.RUNNING) {
    return success({ snapshot, action: "IDLE", shouldContinue: false, nextDelayMs: null });
  }

  const clock = typeof dependencies.now === "function" ? dependencies.now : () => Date.now();
  const persistSnapshot = dependencies.persistSnapshot;
  const putFetchedHtml = dependencies.putFetchedHtml;
  const fetchPage = dependencies.fetchPage ?? fetchHtmlPage;
  const discoverLinks = dependencies.discoverLinks ?? discoverPageLinks;
  if (typeof persistSnapshot !== "function" || typeof putFetchedHtml !== "function") {
    return failure("NETWORK_CRAWLER_DEPENDENCY_MISSING", "Persistence dependencies are required");
  }

  let now = clock();
  let next = structuredClone(snapshot);
  const queue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
  const dequeued = queue.dequeue(now);
  if (!dequeued.ok) return dequeued;
  const task = dequeued.value;

  if (!task) {
    const wait = nextQueuedDelay(queue.snapshot(), now);
    if (wait !== null) return success({ snapshot: next, action: "WAIT", shouldContinue: true, nextDelayMs: wait });
    return finalizeNetworkStage(next, persistSnapshot, now);
  }

  next.queue = queue.snapshot();
  next.run.activeTaskId = task.taskId;
  let counted = syncCounts(next, queue, now);
  if (!counted.ok) return counted;
  next = counted.value;
  let event = withEvent(next, PROGRESS_EVENT_TYPES.TASK_FETCHING, { task }, now);
  if (!event.ok) return event;
  next = event.value;
  let persisted = await persistSnapshot(next);
  if (!persisted.ok) return persisted;
  next = persisted.value;

  const fetched = await fetchPage({
    url: task.url,
    timeoutMs: next.config.fetchTimeoutMs,
    maxHtmlBytes: next.config.maxHtmlBytes
  }, dependencies.fetchDependencies ?? {});
  now = clock();

  if (!fetched.ok) {
    const details = fetched.error.details ?? {};
    const retryable = fetched.error.recoverable && task.attempt < next.config.retryLimit;
    const liveQueue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
    if (retryable) {
      const delay = retryDelay(next.config, task, details);
      const changed = liveQueue.markState(task.taskId, TASK_STATES.QUEUED, {
        attempt: task.attempt + 1,
        availableAt: now + delay,
        reasonCode: fetched.error.code
      }, now);
      if (!changed.ok) return changed;
      next.run.activeTaskId = null;
      counted = syncCounts(next, liveQueue, now);
      if (!counted.ok) return counted;
      next = counted.value;
      event = withEvent(next, PROGRESS_EVENT_TYPES.TASK_RETRY_SCHEDULED, {
        taskId: task.taskId,
        reasonCode: fetched.error.code,
        attempt: task.attempt + 1,
        availableAt: now + delay
      }, now);
      if (!event.ok) return event;
      next = event.value;
      persisted = await persistSnapshot(next);
      return persisted.ok ? success({ snapshot: persisted.value, action: "RETRY", shouldContinue: true, nextDelayMs: delay }) : persisted;
    }

    const terminalState = details.disposition === "SKIP" ? TASK_STATES.SKIPPED : TASK_STATES.FAILED;
    const changed = liveQueue.markState(task.taskId, terminalState, { reasonCode: fetched.error.code }, now);
    if (!changed.ok) return changed;
    next.run.activeTaskId = null;
    counted = syncCounts(next, liveQueue, now);
    if (!counted.ok) return counted;
    next = counted.value;
    event = withEvent(next, terminalState === TASK_STATES.SKIPPED ? PROGRESS_EVENT_TYPES.PAGE_SKIPPED : PROGRESS_EVENT_TYPES.PAGE_FAILED, {
      taskId: task.taskId,
      reasonCode: fetched.error.code
    }, now);
    if (!event.ok) return event;
    next = event.value;
    persisted = await persistSnapshot(next);
    return persisted.ok ? success({ snapshot: persisted.value, action: terminalState, shouldContinue: true, nextDelayMs: next.config.requestDelayMs }) : persisted;
  }

  const finalInspection = inspectUrl(fetched.value.finalUrl, null, next.config, {
    depth: task.depth
  });
  if (!finalInspection.ok || !finalInspection.value.scope.allowed) {
    const liveQueue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
    const reasonCode = finalInspection.ok ? "REDIRECT_OUT_OF_SCOPE" : finalInspection.error.code;
    const changed = liveQueue.markState(task.taskId, TASK_STATES.SKIPPED, { reasonCode }, now);
    if (!changed.ok) return changed;
    next.run.activeTaskId = null;
    counted = syncCounts(next, liveQueue, now);
    if (!counted.ok) return counted;
    next = counted.value;
    event = withEvent(next, PROGRESS_EVENT_TYPES.PAGE_SKIPPED, { taskId: task.taskId, reasonCode }, now);
    if (!event.ok) return event;
    next = event.value;
    persisted = await persistSnapshot(next);
    return persisted.ok ? success({ snapshot: persisted.value, action: "SKIPPED", shouldContinue: true, nextDelayMs: next.config.requestDelayMs }) : persisted;
  }

  const storedHtml = await putFetchedHtml({
    crawlId: next.run.crawlId,
    taskId: task.taskId,
    url: fetched.value.finalUrl,
    html: fetched.value.html,
    fetchedAt: fetched.value.fetchedAt
  });
  if (!storedHtml.ok) return storedHtml;

  const discovery = discoverLinks(fetched.value.html, fetched.value.finalUrl);
  if (!discovery.ok) return discovery;
  const liveQueue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
  let accepted = 0;
  let rejected = 0;
  let taskSequence = next.run.nextTaskSequence;
  let discoverySequence = next.run.nextDiscoverySequence;
  const depth = task.depth + 1;

  for (const link of discovery.value.links) {
    if (liveQueue.totalSize() >= next.config.maxPages) { rejected++; break; }
    const inspected = inspectUrl(link.resolvedUrl, null, next.config, {
      depth,
      currentPageCount: liveQueue.totalSize(),
      registry: registryFor(liveQueue)
    });
    if (!inspected.ok || !inspected.value.scope.allowed) { rejected++; continue; }
    const created = createTaskRecord({
      taskId: `task_${next.run.crawlId}_${taskSequence}`,
      crawlId: next.run.crawlId,
      url: inspected.value.normalizedUrl,
      canonicalKey: inspected.value.canonicalKey,
      parentUrl: fetched.value.finalUrl,
      depth,
      priorityScore: 0,
      discoveryOrder: discoverySequence,
      attempt: 0,
      state: TASK_STATES.QUEUED,
      availableAt: now
    }, now);
    if (!created.ok) return created;
    const queued = liveQueue.enqueue(created.value);
    if (!queued.ok) { rejected++; continue; }
    accepted++;
    taskSequence++;
    discoverySequence++;
    event = withEvent(next, PROGRESS_EVENT_TYPES.TASK_DISCOVERED, { task: created.value, sourceTaskId: task.taskId }, now);
    if (!event.ok) return event;
    next = event.value;
    event = withEvent(next, PROGRESS_EVENT_TYPES.TASK_QUEUED, { task: created.value }, now);
    if (!event.ok) return event;
    next = event.value;
  }

  let canonicalUrl = null;
  if (discovery.value.canonicalUrl) {
    const canonical = inspectUrl(discovery.value.canonicalUrl, null, next.config, { depth: task.depth });
    if (canonical.ok && canonical.value.scope.allowed) canonicalUrl = canonical.value.normalizedUrl;
  }

  const changed = liveQueue.markState(task.taskId, TASK_STATES.FETCHED, { reasonCode: null }, now);
  if (!changed.ok) return changed;
  next.run.activeTaskId = null;
  next.run.nextTaskSequence = taskSequence;
  next.run.nextDiscoverySequence = discoverySequence;
  counted = syncCounts(next, liveQueue, now);
  if (!counted.ok) return counted;
  next = counted.value;
  const record = createFetchRecord({
    ...fetched.value,
    taskId: task.taskId,
    canonicalUrl,
    discoveredLinkCount: discovery.value.links.length,
    acceptedLinkCount: accepted,
    rejectedLinkCount: rejected
  });
  if (!record.ok) return record;
  next.fetchRecords = [...(Array.isArray(next.fetchRecords) ? next.fetchRecords.filter(item => item.taskId !== task.taskId) : []), record.value].slice(-next.config.maxPages);
  event = withEvent(next, PROGRESS_EVENT_TYPES.PAGE_FETCHED, {
    taskId: task.taskId,
    finalUrl: fetched.value.finalUrl,
    canonicalUrl,
    discoveredLinkCount: discovery.value.links.length,
    acceptedLinkCount: accepted,
    rejectedLinkCount: rejected
  }, now);
  if (!event.ok) return event;
  next = event.value;
  persisted = await persistSnapshot(next);
  return persisted.ok ? success({ snapshot: persisted.value, action: "FETCHED", shouldContinue: true, nextDelayMs: next.config.requestDelayMs }) : persisted;
}
