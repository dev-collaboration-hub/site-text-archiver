import { failure, success } from "../shared/result.js";

export const PROGRESS_EVENT_TYPES = Object.freeze({
  CRAWL_CREATED: "CRAWL_CREATED",
  CRAWL_PLANNED: "CRAWL_PLANNED",
  CRAWL_STARTED: "CRAWL_STARTED",
  CRAWL_PAUSING: "CRAWL_PAUSING",
  CRAWL_PAUSED: "CRAWL_PAUSED",
  CRAWL_RESUMED: "CRAWL_RESUMED",
  CRAWL_CANCELLED: "CRAWL_CANCELLED",
  TASK_DISCOVERED: "TASK_DISCOVERED",
  TASK_QUEUED: "TASK_QUEUED",
  TASK_FETCHING: "TASK_FETCHING",
  TASK_RETRY_SCHEDULED: "TASK_RETRY_SCHEDULED",
  TASK_STATE_CHANGED: "TASK_STATE_CHANGED",
  PAGE_FETCHED: "PAGE_FETCHED",
  PAGE_SKIPPED: "PAGE_SKIPPED",
  PAGE_FAILED: "PAGE_FAILED",
  FINALIZATION_STARTED: "FINALIZATION_STARTED",
  CRAWL_COMPLETED: "CRAWL_COMPLETED",
  CRAWL_RESTORED: "CRAWL_RESTORED"
});

const EVENT_TYPE_SET = new Set(Object.values(PROGRESS_EVENT_TYPES));

export function appendProgressEvent(run, events, type, payload = {}, now = Date.now(), maxEvents = 200) {
  if (!run || typeof run !== "object") {
    return failure("INVALID_STATE", "Crawl run is required for progress events");
  }
  if (!EVENT_TYPE_SET.has(type)) {
    return failure("INVALID_EVENT_TYPE", "Progress event type is not supported", false, { type });
  }
  const sequence = run.nextEventSequence;
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    return failure("INVALID_EVENT_SEQUENCE", "Progress event sequence is invalid");
  }
  const event = {
    protocolVersion: 1,
    type,
    eventId: `event_${run.crawlId}_${sequence}`,
    crawlId: run.crawlId,
    sequence,
    payload: {
      lifecycle: run.lifecycle,
      stateVersion: run.stateVersion,
      counts: { ...run.counts },
      ...payload
    },
    timestamp: now
  };
  const nextRun = { ...run, nextEventSequence: sequence + 1, updatedAt: now };
  const nextEvents = [...(Array.isArray(events) ? events : []), event].slice(-maxEvents);
  return success({ run: nextRun, events: nextEvents, event });
}
