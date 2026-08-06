# Site Text Archiver — Requirements Traceability

## 1. Purpose

This document maps product capabilities to milestones, source files, and verification evidence. A documented capability is not counted as implemented until working source and tests exist.

## 2. Status Meanings

- **Documented** — design exists; working behavior is not complete.
- **Implemented** — source exists and main behavior is present.
- **Verified locally** — deterministic automated or mocked-environment evidence passes.
- **Manual acceptance pending** — browser interaction still needs to be recorded.
- **Deferred** — intentionally outside the current functional-release boundary.

## 3. Capability Matrix

| Capability | Milestone | Implementation | Evidence | Current state |
|---|---:|---|---|---|
| Manifest V3 extension shell | M0 | `manifest.json`, `src/background/` | Syntax checks; Chrome checklist | Implemented; manual acceptance pending |
| Shared results, IDs, and settings | M0 | `src/shared/`, `src/storage/settings-store.js` | `tests/unit/index.test.js` | Verified locally; browser persistence pending |
| Popup and dashboard foundation | M0 | `popup/`, `dashboard/` | Manual render and console checks | Implemented; manual acceptance pending |
| URL resolution and canonicalization | M1 | `url-resolver.js`, `url-normalizer.js`, `query-policy.js`, `url-intelligence.js` | M1 unit and edge tests | Verified locally |
| Origin, path, pattern, limit, and unsafe-link enforcement | M1 | `scope-guard.js`, `link-safety.js`, `blocked-extensions.js` | M1 scope and safety tests | Verified locally |
| Duplicate URL intelligence | M1 | `duplicate-url-registry.js` | Duplicate and snapshot tests | Verified locally |
| Crawl configuration bounds | M2 | `src/crawler/crawl-config.js` | M2 configuration and command-flow tests | Verified locally |
| Crawl lifecycle state machine | M2 | `crawl-state.js`, `state-transition.js`, `crawl-run.js` | Valid, invalid, terminal, and version tests | Verified locally |
| Deterministic task queue | M2 | `task-record.js`, `priority-task-queue.js` | Ordering, duplicate, dequeue, and snapshot tests | Verified locally |
| Persisted resumable crawl state | M2 | `src/storage/crawl-store.js`, `runtime-controller.js` | Mocked storage and restart-recovery tests | Verified locally |
| Idempotent state-changing commands | M2 | `request-cache.js`, `runtime-controller.js` | Request replay and misuse tests | Verified locally |
| Pause, resume, and cancel controls | M2 | service worker, popup, runtime controller | State-flow tests; browser controls | Implemented and locally verified; manual browser acceptance pending |
| Crawl counts and progress events | M2 | `crawl-run.js`, `progress-events.js`, dashboard | Event and summary integration tests | Verified locally |
| Bounded HTML fetching | M3 | planned `src/crawler/fetcher.js` and response policy | Timeout, response, and content-type tests | Documented |
| Link discovery and base URL handling | M3 | planned discovery modules | Fixture-site tests | Documented |
| Failure and retry classification | M3 | planned fetch/recovery modules | Temporary/permanent failure tests | Documented |
| Semantic content extraction | M4 | planned `src/extraction/` | HTML fixture and golden-output tests | Documented |
| Markdown and JSON archive export | M5 | planned `src/export/` | Golden Markdown and JSON tests | Documented |
| Offline agent quality and bounded recovery | M6 | planned `src/agent/`, `src/quality/` | Deterministic decision and scoring tests | Documented |
| Local search index | M7 | planned `src/search/` | Ranking and deterministic-index tests | Documented |
| Extractive local question answering | M8 | planned `src/qa/` | Passage, evidence, and attribution tests | Documented |
| Complete dashboard and functional release | M9 | popup, dashboard, release artifacts | End-to-end browser acceptance | Documented |
| Security and privacy hardening beyond baseline | Deferred | future hardening work | Separate review plan | Deferred |

## 4. M0 Evidence

Source and smoke tests exist for the extension shell, messages, settings, identifiers, popup, and dashboard. Chrome load-unpacked and restart-persistence results remain to be recorded in `M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.

## 5. M1 Evidence

Source:

```text
src/crawler/query-policy.js
src/crawler/url-resolver.js
src/crawler/url-normalizer.js
src/crawler/blocked-extensions.js
src/crawler/link-safety.js
src/crawler/scope-guard.js
src/crawler/duplicate-url-registry.js
src/crawler/url-intelligence.js
```

Tests:

```text
tests/unit/index.test.js
tests/unit/m1-edge.test.js
```

Detailed evidence: `M1_IMPLEMENTATION_REPORT.md`.

## 6. M2 Evidence

Source:

```text
src/crawler/crawl-config.js
src/crawler/crawl-run.js
src/crawler/crawl-state.js
src/crawler/state-transition.js
src/crawler/task-record.js
src/crawler/priority-task-queue.js
src/crawler/progress-events.js
src/messaging/request-cache.js
src/messaging/event-publisher.js
src/storage/crawl-store.js
src/background/runtime-controller.js
```

Integration:

```text
src/messaging/message-types.js
src/messaging/message-validator.js
src/background/service-worker.js
popup/
dashboard/
```

Tests:

```text
tests/unit/m2.test.js
tests/unit/m2-recovery.test.js
```

Verified behavior includes deterministic queue order, state-transition rejection, idempotent commands, persisted lifecycle controls, interrupted-task requeueing, and preservation of completed tasks during simulated service-worker recovery.

Detailed evidence: `M2_IMPLEMENTATION_REPORT.md`.

## 7. Current State

```text
Documentation foundation: 100% for current approved scope
M0: implemented; manual Chrome acceptance pending
M1: implemented and locally verified
M2: implemented and locally verified
Functional product completion: approximately 32%
Next target: M3 Page Fetching and Link Discovery
```

M2 does not claim website fetching. Network processing starts in M3.
