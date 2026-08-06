import { CRAWL_STATES, SCHEMA_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";

export function createCrawlRun(crawlId, now = Date.now()) {
  if (typeof crawlId !== "string" || crawlId.length === 0) {
    return failure("INVALID_CRAWL_ID", "crawlId must be a non-empty string");
  }
  return success({
    schemaVersion: SCHEMA_VERSION,
    runId: `run_${crawlId}_1`,
    crawlId,
    lifecycle: CRAWL_STATES.PLANNING,
    stateVersion: 0,
    cancelRequested: false,
    pauseRequested: false,
    activeTaskId: null,
    nextTaskSequence: 1,
    nextDiscoverySequence: 1,
    nextEventSequence: 1,
    counts: {
      discovered: 0,
      queued: 0,
      fetching: 0,
      completed: 0,
      skipped: 0,
      failed: 0
    },
    limits: {
      acceptedPages: 0,
      reservedTasks: 0
    },
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  });
}

export function syncRunCounts(run, queueCounts, now = Date.now()) {
  if (!run || typeof run !== "object") {
    return failure("INVALID_STATE", "Crawl run is invalid");
  }
  const next = {
    ...run,
    counts: {
      ...run.counts,
      discovered: Object.values(queueCounts).reduce((sum, value) => sum + value, 0),
      queued: queueCounts.queued ?? 0,
      fetching: queueCounts.fetching ?? 0,
      completed: queueCounts.completed ?? 0,
      skipped: queueCounts.skipped ?? 0,
      failed: queueCounts.failed ?? 0
    },
    updatedAt: now
  };
  return success(next);
}

export function createCrawlSummary(snapshot) {
  if (!snapshot?.run || !snapshot?.config) {
    return failure("ACTIVE_CRAWL_NOT_FOUND", "No active crawl snapshot exists");
  }
  const currentTask = snapshot.run.activeTaskId
    ? snapshot.queue?.tasks?.find(task => task.taskId === snapshot.run.activeTaskId) ?? null
    : null;
  return success({
    crawlId: snapshot.run.crawlId,
    lifecycle: snapshot.run.lifecycle,
    stateVersion: snapshot.run.stateVersion,
    counts: { ...snapshot.run.counts },
    currentTask,
    queuedTasks: snapshot.queue?.tasks?.filter(task => task.state === "QUEUED").length ?? 0,
    recentEventCount: snapshot.events?.length ?? 0,
    startUrl: snapshot.config.startUrl,
    createdAt: snapshot.run.createdAt,
    updatedAt: snapshot.run.updatedAt
  });
}
