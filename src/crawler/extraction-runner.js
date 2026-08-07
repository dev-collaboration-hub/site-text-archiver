import { failure, success } from "../shared/result.js";
import { syncRunCounts } from "./crawl-run.js";
import { extractPageFromHtml } from "../extraction/extraction-pipeline.js";
import { appendProgressEvent, PROGRESS_EVENT_TYPES } from "./progress-events.js";
import { createPriorityTaskQueue } from "./priority-task-queue.js";
import { TASK_STATES } from "./task-record.js";

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

function nextFetchedTask(queueSnapshot) {
  return [...(queueSnapshot?.tasks ?? [])]
    .filter(task => task.state === TASK_STATES.FETCHED)
    .sort((a, b) => a.discoveryOrder - b.discoveryOrder || a.taskId.localeCompare(b.taskId))[0] ?? null;
}

export function hasFetchedTasks(snapshot) {
  return Boolean(nextFetchedTask(snapshot?.queue));
}

export async function processNextExtractionTask(snapshot, dependencies = {}) {
  const clock = typeof dependencies.now === "function" ? dependencies.now : () => Date.now();
  const persistSnapshot = dependencies.persistSnapshot;
  const getFetchedHtml = dependencies.getFetchedHtml;
  const putPageRecord = dependencies.putPageRecord;
  const deleteFetchedHtml = dependencies.deleteFetchedHtml;
  const extractPage = dependencies.extractPage ?? extractPageFromHtml;
  if (typeof persistSnapshot !== "function" || typeof getFetchedHtml !== "function" || typeof putPageRecord !== "function") {
    return failure("EXTRACTION_DEPENDENCY_MISSING", "Extraction persistence dependencies are required");
  }

  let next = structuredClone(snapshot);
  let now = clock();
  const task = nextFetchedTask(next.queue);
  if (!task) return success({ snapshot: next, action: "NO_EXTRACTION_WORK", shouldContinue: true, nextDelayMs: 0 });

  let queue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
  let changed = queue.markState(task.taskId, TASK_STATES.EXTRACTING, { reasonCode: null }, now);
  if (!changed.ok) return changed;
  next.run.activeTaskId = task.taskId;
  let counted = syncCounts(next, queue, now);
  if (!counted.ok) return counted;
  next = counted.value;
  let event = withEvent(next, PROGRESS_EVENT_TYPES.PAGE_EXTRACTING, { taskId: task.taskId, url: task.url }, now);
  if (!event.ok) return event;
  next = event.value;
  let persisted = await persistSnapshot(next);
  if (!persisted.ok) return persisted;
  next = persisted.value;

  const storedHtml = await getFetchedHtml(task.crawlId, task.taskId);
  now = clock();
  if (!storedHtml.ok || !storedHtml.value?.html) {
    queue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
    changed = queue.markState(task.taskId, TASK_STATES.FAILED, {
      reasonCode: storedHtml.ok ? "FETCHED_HTML_NOT_FOUND" : storedHtml.error.code
    }, now);
    if (!changed.ok) return changed;
    next.run.activeTaskId = null;
    counted = syncCounts(next, queue, now);
    if (!counted.ok) return counted;
    next = counted.value;
    event = withEvent(next, PROGRESS_EVENT_TYPES.PAGE_EXTRACTION_FAILED, {
      taskId: task.taskId,
      reasonCode: changed.value.reasonCode
    }, now);
    if (!event.ok) return event;
    next = event.value;
    persisted = await persistSnapshot(next);
    return persisted.ok ? success({ snapshot: persisted.value, action: "EXTRACTION_FAILED", shouldContinue: true, nextDelayMs: 0 }) : persisted;
  }

  const fetchRecord = (next.fetchRecords ?? []).find(record => record.taskId === task.taskId) ?? null;
  const extracted = await extractPage({
    html: storedHtml.value.html,
    task,
    url: storedHtml.value.url ?? fetchRecord?.finalUrl ?? task.url,
    canonicalUrl: fetchRecord?.canonicalUrl ?? task.url,
    fetchedAt: storedHtml.value.fetchedAt ?? fetchRecord?.fetchedAt ?? null,
    extractedAt: now
  }, { cryptoObject: dependencies.cryptoObject });

  if (!extracted.ok) {
    queue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
    changed = queue.markState(task.taskId, TASK_STATES.FAILED, { reasonCode: extracted.error.code }, now);
    if (!changed.ok) return changed;
    next.run.activeTaskId = null;
    counted = syncCounts(next, queue, now);
    if (!counted.ok) return counted;
    next = counted.value;
    event = withEvent(next, PROGRESS_EVENT_TYPES.PAGE_EXTRACTION_FAILED, {
      taskId: task.taskId,
      reasonCode: extracted.error.code,
      details: extracted.error.details ?? {}
    }, now);
    if (!event.ok) return event;
    next = event.value;
    persisted = await persistSnapshot(next);
    return persisted.ok ? success({ snapshot: persisted.value, action: "EXTRACTION_FAILED", shouldContinue: true, nextDelayMs: 0 }) : persisted;
  }

  const storedPage = await putPageRecord(extracted.value);
  if (!storedPage.ok) return storedPage;
  if (typeof deleteFetchedHtml === "function") await deleteFetchedHtml(task.crawlId, task.taskId);

  queue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });
  changed = queue.markState(task.taskId, TASK_STATES.EXTRACTED, { reasonCode: null }, now);
  if (!changed.ok) return changed;
  next.run.activeTaskId = null;
  next.pageSummaries = [
    ...(Array.isArray(next.pageSummaries) ? next.pageSummaries.filter(item => item.taskId !== task.taskId) : []),
    {
      pageId: extracted.value.pageId,
      taskId: extracted.value.taskId,
      url: extracted.value.url,
      title: extracted.value.title,
      blockCount: extracted.value.blocks.length,
      headingCount: extracted.value.headings.length,
      warningCount: extracted.value.extractionWarnings.length,
      extractedAt: extracted.value.extractedAt
    }
  ].sort((a, b) => a.extractedAt - b.extractedAt || a.pageId.localeCompare(b.pageId));
  counted = syncCounts(next, queue, now);
  if (!counted.ok) return counted;
  next = counted.value;
  event = withEvent(next, PROGRESS_EVENT_TYPES.PAGE_EXTRACTED, {
    taskId: task.taskId,
    pageId: extracted.value.pageId,
    title: extracted.value.title,
    blockCount: extracted.value.blocks.length,
    warningCount: extracted.value.extractionWarnings.length
  }, now);
  if (!event.ok) return event;
  next = event.value;
  persisted = await persistSnapshot(next);
  return persisted.ok ? success({ snapshot: persisted.value, action: "EXTRACTED", shouldContinue: true, nextDelayMs: 0 }) : persisted;
}
