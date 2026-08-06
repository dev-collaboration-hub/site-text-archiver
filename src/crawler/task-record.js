import { SCHEMA_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";

export const TASK_STATES = Object.freeze({
  DISCOVERED: "DISCOVERED",
  QUEUED: "QUEUED",
  FETCHING: "FETCHING",
  FETCHED: "FETCHED",
  EXTRACTING: "EXTRACTING",
  EXTRACTED: "EXTRACTED",
  VALIDATING: "VALIDATING",
  COMPLETED: "COMPLETED",
  SKIPPED: "SKIPPED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED"
});

export const TASK_STATE_SET = new Set(Object.values(TASK_STATES));

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

export function validateTaskRecord(task) {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return failure("INVALID_TASK", "Task record must be an object");
  }
  for (const field of ["taskId", "crawlId", "url", "canonicalKey"]) {
    if (!isNonEmptyString(task[field])) {
      return failure("INVALID_TASK", `Task ${field} must be a non-empty string`, false, { field });
    }
  }
  if (!TASK_STATE_SET.has(task.state)) {
    return failure("INVALID_TASK_STATE", "Task state is not recognized", false, { state: task.state });
  }
  for (const field of ["depth", "discoveryOrder", "attempt", "availableAt", "createdAt", "updatedAt"]) {
    if (!Number.isSafeInteger(task[field]) || task[field] < 0) {
      return failure("INVALID_TASK", `Task ${field} must be a non-negative safe integer`, false, { field });
    }
  }
  if (!Number.isFinite(task.priorityScore)) {
    return failure("INVALID_TASK", "Task priorityScore must be finite", false, { field: "priorityScore" });
  }
  return success({ ...task });
}

export function createTaskRecord(input, now = Date.now()) {
  const task = {
    schemaVersion: SCHEMA_VERSION,
    taskId: input?.taskId,
    crawlId: input?.crawlId,
    url: input?.url,
    canonicalKey: input?.canonicalKey,
    parentUrl: input?.parentUrl ?? null,
    depth: input?.depth ?? 0,
    priorityScore: input?.priorityScore ?? 0,
    discoveryOrder: input?.discoveryOrder ?? 0,
    attempt: input?.attempt ?? 0,
    state: input?.state ?? TASK_STATES.QUEUED,
    availableAt: input?.availableAt ?? now,
    reasonCode: input?.reasonCode ?? null,
    createdAt: input?.createdAt ?? now,
    updatedAt: input?.updatedAt ?? now
  };
  return validateTaskRecord(task);
}

export function updateTaskState(task, state, patch = {}, now = Date.now()) {
  if (!TASK_STATE_SET.has(state)) {
    return failure("INVALID_TASK_STATE", "Task state is not recognized", false, { state });
  }
  const next = {
    ...task,
    ...patch,
    state,
    updatedAt: now
  };
  return validateTaskRecord(next);
}
