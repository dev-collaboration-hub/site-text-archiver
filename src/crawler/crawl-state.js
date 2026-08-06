import { CRAWL_STATES } from "../shared/constants.js";

export const CRAWL_EVENTS = Object.freeze({
  PLAN_READY: "PLAN_READY",
  START: "START",
  REQUEST_PAUSE: "REQUEST_PAUSE",
  PAUSE_SAFE: "PAUSE_SAFE",
  RESUME: "RESUME",
  BEGIN_FINALIZE: "BEGIN_FINALIZE",
  COMPLETE: "COMPLETE",
  CANCEL: "CANCEL",
  FAIL: "FAIL"
});

export const CRAWL_STATE_SET = new Set(Object.values(CRAWL_STATES));
export const TERMINAL_CRAWL_STATES = new Set([
  CRAWL_STATES.COMPLETED,
  CRAWL_STATES.CANCELLED,
  CRAWL_STATES.FAILED
]);

export function isKnownCrawlState(state) {
  return CRAWL_STATE_SET.has(state);
}

export function isTerminal(state) {
  return TERMINAL_CRAWL_STATES.has(state);
}
