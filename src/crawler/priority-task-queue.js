import { failure, success } from "../shared/result.js";
import { TASK_STATES, updateTaskState, validateTaskRecord } from "./task-record.js";

export const QUEUE_SNAPSHOT_VERSION = 1;

export function compareTasks(a, b) {
  return (
    b.priorityScore - a.priorityScore ||
    a.attempt - b.attempt ||
    a.depth - b.depth ||
    a.discoveryOrder - b.discoveryOrder ||
    a.canonicalKey.localeCompare(b.canonicalKey) ||
    a.taskId.localeCompare(b.taskId)
  );
}

export function createPriorityTaskQueue(options = {}) {
  const maxSize = Number.isInteger(options.maxSize) && options.maxSize > 0
    ? options.maxSize
    : 10000;
  const tasks = new Map();
  const canonicalKeys = new Map();

  function pendingTasks(now = Number.MAX_SAFE_INTEGER) {
    return [...tasks.values()]
      .filter(task => task.state === TASK_STATES.QUEUED && task.availableAt <= now)
      .sort(compareTasks);
  }

  function register(task) {
    tasks.set(task.taskId, { ...task });
    canonicalKeys.set(task.canonicalKey, task.taskId);
  }

  function enqueue(task) {
    const validated = validateTaskRecord(task);
    if (!validated.ok) return validated;
    if (tasks.has(task.taskId) || canonicalKeys.has(task.canonicalKey)) {
      return failure("DUPLICATE_TASK", "Task or canonical URL is already in the queue", false, {
        taskId: task.taskId,
        canonicalKey: task.canonicalKey
      });
    }
    if (tasks.size >= maxSize) {
      return failure("QUEUE_LIMIT_REACHED", "Task queue reached its configured limit", false, { maxSize });
    }
    if (task.state !== TASK_STATES.QUEUED) {
      return failure("INVALID_TASK_STATE", "New queue tasks must be QUEUED", false, { state: task.state });
    }
    register(validated.value);
    return success({ ...validated.value });
  }

  function enqueueMany(inputTasks) {
    if (!Array.isArray(inputTasks)) {
      return failure("INVALID_TASK_BATCH", "Task batch must be an array");
    }
    if (tasks.size + inputTasks.length > maxSize) {
      return failure("QUEUE_LIMIT_REACHED", "Task batch exceeds queue limit", false, { maxSize });
    }
    const seenIds = new Set(tasks.keys());
    const seenKeys = new Set(canonicalKeys.keys());
    const validatedTasks = [];
    for (const task of inputTasks) {
      const validated = validateTaskRecord(task);
      if (!validated.ok) return validated;
      if (validated.value.state !== TASK_STATES.QUEUED) {
        return failure("INVALID_TASK_STATE", "New queue tasks must be QUEUED", false, { state: validated.value.state });
      }
      if (seenIds.has(validated.value.taskId) || seenKeys.has(validated.value.canonicalKey)) {
        return failure("DUPLICATE_TASK", "Task batch contains a duplicate", false, {
          taskId: validated.value.taskId,
          canonicalKey: validated.value.canonicalKey
        });
      }
      seenIds.add(validated.value.taskId);
      seenKeys.add(validated.value.canonicalKey);
      validatedTasks.push(validated.value);
    }
    for (const task of validatedTasks) register(task);
    return success(validatedTasks.map(task => ({ ...task })));
  }

  function peek(now = Date.now()) {
    const next = pendingTasks(now)[0] ?? null;
    return success(next ? { ...next } : null);
  }

  function dequeue(now = Date.now()) {
    const next = pendingTasks(now)[0] ?? null;
    if (!next) return success(null);
    const updated = updateTaskState(next, TASK_STATES.FETCHING, {}, now);
    if (!updated.ok) return updated;
    tasks.set(next.taskId, updated.value);
    return success({ ...updated.value });
  }

  function markState(taskId, state, patch = {}, now = Date.now()) {
    const task = tasks.get(taskId);
    if (!task) return failure("TASK_NOT_FOUND", "Task does not exist", false, { taskId });
    const updated = updateTaskState(task, state, patch, now);
    if (!updated.ok) return updated;
    tasks.set(taskId, updated.value);
    return success({ ...updated.value });
  }

  function remove(taskId) {
    const task = tasks.get(taskId);
    if (!task) return failure("TASK_NOT_FOUND", "Task does not exist", false, { taskId });
    tasks.delete(taskId);
    canonicalKeys.delete(task.canonicalKey);
    return success({ ...task });
  }

  function counts() {
    const output = {};
    for (const state of Object.values(TASK_STATES)) output[state.toLowerCase()] = 0;
    for (const task of tasks.values()) output[task.state.toLowerCase()] += 1;
    return Object.freeze(output);
  }

  function snapshot() {
    return {
      version: QUEUE_SNAPSHOT_VERSION,
      maxSize,
      tasks: [...tasks.values()]
        .sort((a, b) => a.discoveryOrder - b.discoveryOrder || a.taskId.localeCompare(b.taskId))
        .map(task => ({ ...task }))
    };
  }

  function restore(queueSnapshot) {
    if (!queueSnapshot || queueSnapshot.version !== QUEUE_SNAPSHOT_VERSION || !Array.isArray(queueSnapshot.tasks)) {
      return failure("INVALID_QUEUE_SNAPSHOT", "Queue snapshot is invalid");
    }
    if (queueSnapshot.tasks.length > maxSize) {
      return failure("QUEUE_LIMIT_REACHED", "Queue snapshot exceeds queue limit", false, { maxSize });
    }
    const replacement = createPriorityTaskQueue({ maxSize });
    for (const task of queueSnapshot.tasks) {
      const validated = validateTaskRecord(task);
      if (!validated.ok) return validated;
      if (replacement.hasTask(task.taskId) || replacement.hasCanonicalKey(task.canonicalKey)) {
        return failure("DUPLICATE_TASK", "Queue snapshot contains a duplicate", false, {
          taskId: task.taskId,
          canonicalKey: task.canonicalKey
        });
      }
      replacement._registerForRestore(validated.value);
    }
    tasks.clear();
    canonicalKeys.clear();
    for (const task of replacement.snapshot().tasks) register(task);
    return success(snapshot());
  }

  if (options.snapshot) {
    const restored = restore(options.snapshot);
    if (!restored.ok) throw new TypeError(restored.error.message);
  }

  return Object.freeze({
    enqueue,
    enqueueMany,
    peek,
    dequeue,
    markState,
    remove,
    size: () => [...tasks.values()].filter(task => task.state === TASK_STATES.QUEUED).length,
    totalSize: () => tasks.size,
    get: taskId => tasks.has(taskId) ? { ...tasks.get(taskId) } : null,
    counts,
    snapshot,
    restore,
    hasTask: taskId => tasks.has(taskId),
    hasCanonicalKey: key => canonicalKeys.has(key),
    _registerForRestore: task => register(task)
  });
}
