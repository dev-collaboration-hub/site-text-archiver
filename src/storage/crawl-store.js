import { SCHEMA_VERSION, STORAGE_KEYS } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { isKnownCrawlState } from "../crawler/crawl-state.js";
import { createPriorityTaskQueue } from "../crawler/priority-task-queue.js";
import { TASK_STATES } from "../crawler/task-record.js";

export function validateCrawlSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return failure("INVALID_CRAWL_SNAPSHOT", "Crawl snapshot must be an object");
  }
  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    return failure("SCHEMA_VERSION_UNSUPPORTED", "Crawl snapshot schema version is unsupported", false, {
      schemaVersion: snapshot.schemaVersion
    });
  }
  if (!snapshot.config || !snapshot.run || !snapshot.queue) {
    return failure("INVALID_CRAWL_SNAPSHOT", "Crawl snapshot is missing required sections");
  }
  if (snapshot.config.crawlId !== snapshot.run.crawlId) {
    return failure("INVALID_CRAWL_SNAPSHOT", "Config and run crawl IDs do not match");
  }
  if (!isKnownCrawlState(snapshot.run.lifecycle)) {
    return failure("INVALID_STATE", "Persisted crawl lifecycle is invalid", false, {
      lifecycle: snapshot.run.lifecycle
    });
  }
  try {
    createPriorityTaskQueue({ maxSize: snapshot.config.maxPages, snapshot: snapshot.queue });
  } catch (error) {
    return failure("INVALID_QUEUE_SNAPSHOT", "Persisted queue is invalid", false, {
      message: error instanceof Error ? error.message : String(error)
    });
  }
  return success({
    ...snapshot,
    events: Array.isArray(snapshot.events) ? snapshot.events.map(event => ({ ...event })) : [],
    requestCache: Array.isArray(snapshot.requestCache) ? snapshot.requestCache.map(item => ({ ...item })) : []
  });
}

export async function loadActiveCrawl(storageArea = chrome.storage.local) {
  try {
    const stored = await storageArea.get(STORAGE_KEYS.ACTIVE_CRAWL);
    const snapshot = stored[STORAGE_KEYS.ACTIVE_CRAWL] ?? null;
    if (!snapshot) return success(null);
    return validateCrawlSnapshot(snapshot);
  } catch (error) {
    return failure("CRAWL_LOAD_FAILED", "Active crawl could not be loaded", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function saveActiveCrawl(snapshot, storageArea = chrome.storage.local) {
  const validated = validateCrawlSnapshot(snapshot);
  if (!validated.ok) return validated;
  try {
    await storageArea.set({ [STORAGE_KEYS.ACTIVE_CRAWL]: validated.value });
    return success(validated.value);
  } catch (error) {
    return failure("CRAWL_SAVE_FAILED", "Active crawl could not be saved", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function clearActiveCrawl(storageArea = chrome.storage.local) {
  try {
    await storageArea.remove(STORAGE_KEYS.ACTIVE_CRAWL);
    return success({ cleared: true });
  } catch (error) {
    return failure("CRAWL_CLEAR_FAILED", "Active crawl could not be cleared", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

export function repairInterruptedSnapshot(snapshot, now = Date.now()) {
  const validated = validateCrawlSnapshot(snapshot);
  if (!validated.ok) return validated;
  const next = structuredClone(validated.value);
  const queue = createPriorityTaskQueue({ maxSize: next.config.maxPages, snapshot: next.queue });

  if (next.run.activeTaskId) {
    const active = queue.get(next.run.activeTaskId);
    if (active && active.state === TASK_STATES.FETCHING) {
      const repaired = queue.markState(active.taskId, TASK_STATES.QUEUED, {
        availableAt: now,
        reasonCode: "RUNTIME_RESTORED"
      }, now);
      if (!repaired.ok) return repaired;
    }
    next.run.activeTaskId = null;
  }

  if (next.run.lifecycle === "PAUSING") {
    next.run.lifecycle = "PAUSED";
    next.run.stateVersion += 1;
    next.run.pausedAt = now;
  }

  next.run.updatedAt = now;
  next.queue = queue.snapshot();
  return success(next);
}
