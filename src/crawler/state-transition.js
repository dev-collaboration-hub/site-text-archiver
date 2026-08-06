import { CRAWL_STATES } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { CRAWL_EVENTS, isKnownCrawlState, isTerminal } from "./crawl-state.js";

const TRANSITIONS = Object.freeze({
  [CRAWL_STATES.PLANNING]: Object.freeze({
    [CRAWL_EVENTS.PLAN_READY]: CRAWL_STATES.READY
  }),
  [CRAWL_STATES.READY]: Object.freeze({
    [CRAWL_EVENTS.START]: CRAWL_STATES.RUNNING
  }),
  [CRAWL_STATES.RUNNING]: Object.freeze({
    [CRAWL_EVENTS.REQUEST_PAUSE]: CRAWL_STATES.PAUSING,
    [CRAWL_EVENTS.BEGIN_FINALIZE]: CRAWL_STATES.FINALIZING
  }),
  [CRAWL_STATES.PAUSING]: Object.freeze({
    [CRAWL_EVENTS.PAUSE_SAFE]: CRAWL_STATES.PAUSED
  }),
  [CRAWL_STATES.PAUSED]: Object.freeze({
    [CRAWL_EVENTS.RESUME]: CRAWL_STATES.RUNNING,
    [CRAWL_EVENTS.BEGIN_FINALIZE]: CRAWL_STATES.FINALIZING
  }),
  [CRAWL_STATES.FINALIZING]: Object.freeze({
    [CRAWL_EVENTS.COMPLETE]: CRAWL_STATES.COMPLETED
  })
});

function resolveTarget(from, event) {
  if (event === CRAWL_EVENTS.CANCEL && !isTerminal(from)) {
    return CRAWL_STATES.CANCELLED;
  }
  if (event === CRAWL_EVENTS.FAIL && !isTerminal(from)) {
    return CRAWL_STATES.FAILED;
  }
  return TRANSITIONS[from]?.[event] ?? null;
}

export function canTransition(from, to) {
  if (!isKnownCrawlState(from) || !isKnownCrawlState(to)) {
    return false;
  }
  if (to === CRAWL_STATES.CANCELLED || to === CRAWL_STATES.FAILED) {
    return !isTerminal(from);
  }
  return Object.values(TRANSITIONS[from] ?? {}).includes(to);
}

export function transition(state, event) {
  if (!isKnownCrawlState(state)) {
    return failure("INVALID_STATE", "Crawl state is not recognized", false, { state });
  }
  if (isTerminal(state)) {
    return failure("TERMINAL_STATE_LOCKED", "Terminal crawl state cannot transition", false, { state, event });
  }
  const target = resolveTarget(state, event);
  if (!target) {
    return failure("INVALID_TRANSITION", "Crawl transition is not allowed", false, { state, event });
  }
  return success({ from: state, to: target, event });
}

export function applyRunTransition(run, event, now = Date.now(), expectedStateVersion = null) {
  if (!run || typeof run !== "object") {
    return failure("INVALID_STATE", "Crawl run must be an object");
  }
  if (expectedStateVersion !== null && run.stateVersion !== expectedStateVersion) {
    return failure("STATE_VERSION_MISMATCH", "Persisted crawl state version changed", true, {
      expectedStateVersion,
      actualStateVersion: run.stateVersion
    });
  }
  if (!Number.isSafeInteger(now) || now < 0) {
    return failure("INVALID_TIMESTAMP", "Transition timestamp is invalid");
  }

  const moved = transition(run.lifecycle, event);
  if (!moved.ok) return moved;

  const next = {
    ...run,
    lifecycle: moved.value.to,
    stateVersion: run.stateVersion + 1,
    updatedAt: now
  };

  switch (event) {
    case CRAWL_EVENTS.START:
      next.startedAt ??= now;
      next.pauseRequested = false;
      break;
    case CRAWL_EVENTS.REQUEST_PAUSE:
      next.pauseRequested = true;
      break;
    case CRAWL_EVENTS.PAUSE_SAFE:
      next.pausedAt = now;
      next.pauseRequested = true;
      break;
    case CRAWL_EVENTS.RESUME:
      next.pausedAt = null;
      next.pauseRequested = false;
      break;
    case CRAWL_EVENTS.CANCEL:
      next.cancelRequested = true;
      next.completedAt = now;
      next.activeTaskId = null;
      break;
    case CRAWL_EVENTS.COMPLETE:
    case CRAWL_EVENTS.FAIL:
      next.completedAt = now;
      next.activeTaskId = null;
      break;
    default:
      break;
  }

  return success(next);
}
