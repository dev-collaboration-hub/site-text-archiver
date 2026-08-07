function countBy(values, keyFor) {
  const counts = {};
  for (const value of values) {
    const key = keyFor(value);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function stableTimestamp(snapshot) {
  return snapshot?.run?.completedAt ?? snapshot?.run?.updatedAt ?? snapshot?.run?.createdAt ?? null;
}

export function buildFailureReport(snapshot) {
  const tasks = Array.isArray(snapshot?.queue?.tasks) ? snapshot.queue.tasks : [];
  const failed = tasks
    .filter(task => task.state === "FAILED" || task.state === "SKIPPED")
    .sort((a, b) => (a.discoveryOrder ?? 0) - (b.discoveryOrder ?? 0) || String(a.taskId).localeCompare(String(b.taskId)))
    .map(task => ({
      taskId: task.taskId,
      url: task.url,
      parentUrl: task.parentUrl ?? null,
      state: task.state,
      stage: task.state === "FAILED" ? "FETCH_OR_EXTRACTION" : "POLICY_OR_FETCH",
      errorCode: task.reasonCode ?? "UNKNOWN",
      recoverable: false,
      attempts: (task.attempt ?? 0) + 1,
      depth: task.depth ?? null,
      discoveredAt: task.createdAt ?? null,
      updatedAt: task.updatedAt ?? null
    }));

  return {
    schemaVersion: 1,
    crawlId: snapshot?.run?.crawlId ?? null,
    generatedAt: stableTimestamp(snapshot),
    count: failed.length,
    items: failed
  };
}

export function buildCrawlReport(snapshot, pageRecords = [], softwareVersion = null) {
  const tasks = Array.isArray(snapshot?.queue?.tasks) ? snapshot.queue.tasks : [];
  const fetchRecords = Array.isArray(snapshot?.fetchRecords) ? snapshot.fetchRecords : [];
  const retryAttempts = tasks.reduce((sum, task) => sum + Math.max(0, task.attempt ?? 0), 0);
  const warningCount = pageRecords.reduce((sum, page) => sum + (page.extractionWarnings?.length ?? 0), 0);
  const stateCounts = countBy(tasks, task => task.state ?? "UNKNOWN");
  const reasonCodeSummary = countBy(tasks, task => task.reasonCode);

  return {
    schemaVersion: 1,
    crawlId: snapshot?.run?.crawlId ?? null,
    startUrl: snapshot?.config?.startUrl ?? null,
    scope: {
      allowedOrigin: snapshot?.config?.allowedOrigin ?? null,
      allowedPathPrefix: snapshot?.config?.allowedPathPrefix ?? null,
      maxPages: snapshot?.config?.maxPages ?? null,
      maxDepth: snapshot?.config?.maxDepth ?? null
    },
    lifecycle: snapshot?.run?.lifecycle ?? null,
    startedAt: snapshot?.run?.startedAt ?? null,
    completedAt: snapshot?.run?.completedAt ?? null,
    generatedAt: stableTimestamp(snapshot),
    taskStateCounts: stateCounts,
    pagesExported: pageRecords.length,
    fetchedBytes: fetchRecords.reduce((sum, record) => sum + (Number.isFinite(record.htmlByteLength) ? record.htmlByteLength : 0), 0),
    retries: {
      totalRetryAttempts: retryAttempts,
      tasksRetried: tasks.filter(task => (task.attempt ?? 0) > 0).length
    },
    reasonCodeSummary,
    extractionWarningCount: warningCount,
    softwareVersion
  };
}
