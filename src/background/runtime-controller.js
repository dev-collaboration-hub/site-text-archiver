import { CRAWL_STATES, SCHEMA_VERSION } from "../shared/constants.js";
import { createId } from "../shared/id.js";
import { failure, success } from "../shared/result.js";
import { createCrawlConfig } from "../crawler/crawl-config.js";
import { createCrawlRun, createCrawlSummary, syncRunCounts } from "../crawler/crawl-run.js";
import { CRAWL_EVENTS, isTerminal } from "../crawler/crawl-state.js";
import { appendProgressEvent, PROGRESS_EVENT_TYPES } from "../crawler/progress-events.js";
import { createPriorityTaskQueue } from "../crawler/priority-task-queue.js";
import { applyRunTransition } from "../crawler/state-transition.js";
import { createTaskRecord, TASK_STATES } from "../crawler/task-record.js";
import { inspectUrl } from "../crawler/url-intelligence.js";
import { findCachedRequest, rememberRequest } from "../messaging/request-cache.js";
import { loadActiveCrawl, repairInterruptedSnapshot, saveActiveCrawl } from "../storage/crawl-store.js";

function taskIdFor(crawlId, sequence) {
  return `task_${crawlId}_${sequence}`;
}

function withEvent(snapshot, type, payload, now) {
  const appended = appendProgressEvent(snapshot.run, snapshot.events, type, payload, now);
  if (!appended.ok) return appended;
  return success({
    ...snapshot,
    run: appended.value.run,
    events: appended.value.events,
    lastEvent: appended.value.event
  });
}

function rebuildRunCounts(snapshot, now) {
  const queue = createPriorityTaskQueue({ maxSize: snapshot.config.maxPages, snapshot: snapshot.queue });
  const synced = syncRunCounts(snapshot.run, queue.counts(), now);
  if (!synced.ok) return synced;
  return success({ ...snapshot, run: synced.value });
}

function validateCrawlTarget(snapshot, crawlId) {
  if (!snapshot) return failure("ACTIVE_CRAWL_NOT_FOUND", "No active crawl exists");
  if (typeof crawlId !== "string" || crawlId.length === 0) {
    return failure("INVALID_CRAWL_ID", "crawlId is required");
  }
  if (snapshot.run.crawlId !== crawlId) {
    return failure("CRAWL_ID_MISMATCH", "Requested crawl is not the active crawl", false, {
      requested: crawlId,
      active: snapshot.run.crawlId
    });
  }
  return success(snapshot);
}

export function createRuntimeController(options = {}) {
  const storageArea = options.storageArea;
  const clock = typeof options.now === "function" ? options.now : () => Date.now();
  const cryptoObject = options.cryptoObject ?? globalThis.crypto;
  const publishEvent = typeof options.publishEvent === "function" ? options.publishEvent : async () => {};

  async function persist(snapshot) {
    const { lastEvent, ...cleanSnapshot } = snapshot;
    const saved = await saveActiveCrawl(cleanSnapshot, storageArea);
    if (!saved.ok) return saved;
    if (lastEvent) await publishEvent(lastEvent);
    return success(saved.value);
  }

  async function load() {
    return loadActiveCrawl(storageArea);
  }

  async function executeIdempotent(message, operation) {
    const loaded = await load();
    if (!loaded.ok) return loaded;
    const snapshot = loaded.value;
    if (snapshot) {
      const cached = findCachedRequest(snapshot.requestCache, message.requestId, message.type, message.payload);
      if (!cached.ok) return cached;
      if (cached.value) return cached.value;
    }
    return operation(snapshot);
  }

  async function createCrawl(message) {
    return executeIdempotent(message, async existing => {
      if (existing && !isTerminal(existing.run.lifecycle)) {
        return failure("ACTIVE_CRAWL_EXISTS", "A non-terminal crawl already exists", false, {
          crawlId: existing.run.crawlId,
          lifecycle: existing.run.lifecycle
        });
      }
      const now = clock();
      const crawlId = createId("crawl", now, cryptoObject);
      const config = createCrawlConfig(message.payload.config, crawlId, now);
      if (!config.ok) return config;
      const run = createCrawlRun(crawlId, now);
      if (!run.ok) return run;

      const inspected = inspectUrl(config.value.startUrl, null, config.value, {
        depth: 0,
        currentPageCount: 0
      });
      if (!inspected.ok) return inspected;
      if (!inspected.value.scope.allowed) {
        return failure("START_URL_OUT_OF_SCOPE", "Start URL was rejected by URL safety", false, {
          decision: inspected.value.scope
        });
      }

      const queue = createPriorityTaskQueue({ maxSize: config.value.maxPages });
      const task = createTaskRecord({
        taskId: taskIdFor(crawlId, 1),
        crawlId,
        url: inspected.value.normalizedUrl,
        canonicalKey: inspected.value.canonicalKey,
        parentUrl: null,
        depth: 0,
        priorityScore: 100,
        discoveryOrder: 1,
        attempt: 0,
        state: TASK_STATES.QUEUED,
        availableAt: now
      }, now);
      if (!task.ok) return task;
      const queued = queue.enqueue(task.value);
      if (!queued.ok) return queued;

      let snapshot = {
        schemaVersion: SCHEMA_VERSION,
        config: config.value,
        run: {
          ...run.value,
          nextTaskSequence: 2,
          nextDiscoverySequence: 2
        },
        queue: queue.snapshot(),
        events: [],
        requestCache: []
      };
      const counted = rebuildRunCounts(snapshot, now);
      if (!counted.ok) return counted;
      snapshot = counted.value;

      for (const [type, payload] of [
        [PROGRESS_EVENT_TYPES.CRAWL_CREATED, { crawlId }],
        [PROGRESS_EVENT_TYPES.TASK_DISCOVERED, { task: task.value }],
        [PROGRESS_EVENT_TYPES.TASK_QUEUED, { task: task.value }]
      ]) {
        const eventResult = withEvent(snapshot, type, payload, now);
        if (!eventResult.ok) return eventResult;
        snapshot = eventResult.value;
      }

      const ready = applyRunTransition(snapshot.run, CRAWL_EVENTS.PLAN_READY, now);
      if (!ready.ok) return ready;
      snapshot.run = ready.value;
      const planned = withEvent(snapshot, PROGRESS_EVENT_TYPES.CRAWL_PLANNED, {
        seedTaskCount: 1
      }, now);
      if (!planned.ok) return planned;
      snapshot = planned.value;

      const response = success({
        crawlId,
        lifecycle: snapshot.run.lifecycle,
        stateVersion: snapshot.run.stateVersion,
        config: snapshot.config,
        counts: snapshot.run.counts
      });
      snapshot.requestCache = rememberRequest(snapshot.requestCache, message.requestId, message.type, message.payload, response, now);
      const saved = await persist(snapshot);
      return saved.ok ? response : saved;
    });
  }

  async function mutateCrawl(message, event, progressType, options = {}) {
    return executeIdempotent(message, async snapshot => {
      const target = validateCrawlTarget(snapshot, message.payload.crawlId);
      if (!target.ok) return target;
      const now = clock();
      let next = structuredClone(target.value);
      const moved = applyRunTransition(next.run, event, now);
      if (!moved.ok) return moved;
      next.run = moved.value;
      let emitted = withEvent(next, progressType, {}, now);
      if (!emitted.ok) return emitted;
      next = emitted.value;

      if (options.completePauseImmediately && next.run.lifecycle === CRAWL_STATES.PAUSING && !next.run.activeTaskId) {
        const paused = applyRunTransition(next.run, CRAWL_EVENTS.PAUSE_SAFE, now);
        if (!paused.ok) return paused;
        next.run = paused.value;
        emitted = withEvent(next, PROGRESS_EVENT_TYPES.CRAWL_PAUSED, {}, now);
        if (!emitted.ok) return emitted;
        next = emitted.value;
      }

      if (options.cancelTasks) {
        const queue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
        for (const task of next.queue.tasks) {
          if (![TASK_STATES.COMPLETED, TASK_STATES.SKIPPED, TASK_STATES.FAILED, TASK_STATES.CANCELLED].includes(task.state)) {
            const cancelled = queue.markState(task.taskId, TASK_STATES.CANCELLED, { reasonCode: "CRAWL_CANCELLED" }, now);
            if (!cancelled.ok) return cancelled;
          }
        }
        next.queue = queue.snapshot();
        const counted = rebuildRunCounts(next, now);
        if (!counted.ok) return counted;
        next = counted.value;
      }

      const response = success({
        crawlId: next.run.crawlId,
        lifecycle: next.run.lifecycle,
        stateVersion: next.run.stateVersion,
        pauseRequested: next.run.pauseRequested,
        cancelRequested: next.run.cancelRequested,
        immediate: !next.run.activeTaskId,
        counts: next.run.counts
      });
      next.requestCache = rememberRequest(next.requestCache, message.requestId, message.type, message.payload, response, now);
      const saved = await persist(next);
      return saved.ok ? response : saved;
    });
  }

  async function getSummary(crawlId = null) {
    const loaded = await load();
    if (!loaded.ok) return loaded;
    if (!loaded.value) {
      return success({
        crawlId: null,
        lifecycle: CRAWL_STATES.IDLE,
        stateVersion: 0,
        counts: { discovered: 0, queued: 0, fetching: 0, completed: 0, skipped: 0, failed: 0 },
        currentTask: null,
        queuedTasks: 0,
        recentEventCount: 0,
        createdAt: null,
        updatedAt: null
      });
    }
    if (crawlId && loaded.value.run.crawlId !== crawlId) {
      return failure("CRAWL_ID_MISMATCH", "Requested crawl is not active");
    }
    return createCrawlSummary(loaded.value);
  }

  async function getEvents(crawlId, offset = 0, limit = 50) {
    const loaded = await load();
    if (!loaded.ok) return loaded;
    const target = validateCrawlTarget(loaded.value, crawlId);
    if (!target.ok) return target;
    const boundedOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
    const boundedLimit = Number.isInteger(limit) ? Math.min(200, Math.max(1, limit)) : 50;
    const events = target.value.events ?? [];
    return success({
      items: events.slice(boundedOffset, boundedOffset + boundedLimit),
      page: {
        offset: boundedOffset,
        limit: boundedLimit,
        returned: Math.min(boundedLimit, Math.max(0, events.length - boundedOffset)),
        total: events.length,
        hasMore: boundedOffset + boundedLimit < events.length
      }
    });
  }

  async function restoreActiveCrawl() {
    const loaded = await load();
    if (!loaded.ok || !loaded.value) return loaded;
    const needsRepair = Boolean(loaded.value.run.activeTaskId) ||
      loaded.value.run.lifecycle === CRAWL_STATES.PAUSING;
    if (!needsRepair) return success(loaded.value);

    const now = clock();
    const repaired = repairInterruptedSnapshot(loaded.value, now);
    if (!repaired.ok) return repaired;
    let snapshot = repaired.value;
    const counted = rebuildRunCounts(snapshot, now);
    if (!counted.ok) return counted;
    snapshot = counted.value;
    const eventResult = withEvent(snapshot, PROGRESS_EVENT_TYPES.CRAWL_RESTORED, {}, now);
    if (!eventResult.ok) return eventResult;
    snapshot = eventResult.value;
    return persist(snapshot);
  }

  return Object.freeze({
    createCrawl,
    startCrawl: message => mutateCrawl(message, CRAWL_EVENTS.START, PROGRESS_EVENT_TYPES.CRAWL_STARTED),
    pauseCrawl: message => mutateCrawl(message, CRAWL_EVENTS.REQUEST_PAUSE, PROGRESS_EVENT_TYPES.CRAWL_PAUSING, { completePauseImmediately: true }),
    resumeCrawl: message => mutateCrawl(message, CRAWL_EVENTS.RESUME, PROGRESS_EVENT_TYPES.CRAWL_RESUMED),
    cancelCrawl: message => mutateCrawl(message, CRAWL_EVENTS.CANCEL, PROGRESS_EVENT_TYPES.CRAWL_CANCELLED, { cancelTasks: true }),
    getSummary,
    getEvents,
    restoreActiveCrawl
  });
}
