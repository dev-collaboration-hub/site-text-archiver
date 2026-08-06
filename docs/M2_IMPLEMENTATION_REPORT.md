# Site Text Archiver — M2 Implementation Report

## Status

**M2 — Crawl Queue and State Machine is implemented in source and verified with deterministic pure-module and mocked-persistence tests.**

Product completion after M2: **32%**.

Extension version: **0.3.0**.

Chrome load-unpacked acceptance remains a separate manual check. M2 completion represents implemented queue, lifecycle, command, persistence, statistics, and recovery capability; network fetching begins in M3.

## Implemented Source

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

Updated integration files:

```text
src/shared/constants.js
src/messaging/message-types.js
src/messaging/message-validator.js
src/background/service-worker.js
manifest.json
popup/popup.html
popup/popup.css
popup/popup.js
dashboard/dashboard.html
dashboard/dashboard.css
dashboard/dashboard.js
tests/index.html
```

Verification files:

```text
tests/unit/m2.test.js
tests/unit/m2-recovery.test.js
```

## Delivered Capability

### Crawl lifecycle

- Deterministic lifecycle states and events.
- Valid transition enforcement.
- Terminal-state locking.
- State-version increments on persisted transitions.
- Optimistic state-version mismatch detection.
- Start, pause, safe-pause, resume, cancel, finalize, complete, and fail transition support.

### Deterministic queue

- Bounded priority task queue.
- Stable ordering by priority, attempt, depth, discovery order, canonical URL, and task ID.
- Delayed-task availability support.
- Duplicate task and canonical URL rejection.
- Queue snapshots and exact deterministic restoration.
- Task-state updates and queue statistics.

### Persisted runtime

- Crawl configuration validation and safety bounds.
- Persisted `CrawlRun`, queue, progress events, and request cache.
- Seed task creation only after M1 URL safety approval.
- Idempotent state-changing commands through `requestId` replay protection.
- Active-crawl summary and paginated event queries.
- Cooperative cancellation state.
- Service-worker restart repair.
- Interrupted `FETCHING` tasks return to `QUEUED`.
- Previously completed tasks remain completed after repair.

### User interface

- Create crawl queue.
- Start crawl lifecycle.
- Pause at a safe point.
- Resume paused crawl.
- Cancel non-terminal crawl.
- View lifecycle and queue counts.
- View persisted progress events in the dashboard.

## Runtime Commands

```text
CRAWL_CREATE
CRAWL_START
CRAWL_PAUSE
CRAWL_RESUME
CRAWL_CANCEL
GET_CRAWL_SUMMARY
GET_AGENT_EVENTS
```

Each state-changing command is validated and cached by request ID so replaying the same command does not repeat its side effects.

## Progress Events

Implemented event types include:

```text
CRAWL_CREATED
CRAWL_PLANNED
CRAWL_STARTED
CRAWL_PAUSING
CRAWL_PAUSED
CRAWL_RESUMED
CRAWL_CANCELLED
TASK_DISCOVERED
TASK_QUEUED
TASK_STATE_CHANGED
CRAWL_RESTORED
```

Events use deterministic per-crawl sequence numbers and are retained in a bounded persisted log.

## Verification Coverage

The M2 tests cover:

- Valid lifecycle transitions.
- Invalid transition rejection.
- Terminal-state locking.
- State-version mismatch rejection.
- Deterministic priority ordering.
- Retry, depth, discovery-order, and lexical tie breaking.
- Queue dequeue and state updates.
- Duplicate rejection.
- Queue snapshot restoration.
- Crawl command payload validation.
- Crawl creation with an M1-approved seed URL.
- Persisted start, pause, resume, and cancel flows.
- Idempotent request replay.
- Request-ID misuse rejection.
- Interrupted-task repair after a simulated worker restart.
- Preservation of completed tasks during restart recovery.

The core M2 modules and runtime flow were executed locally in a Node ES-module verification harness with an injected in-memory Chrome-storage replacement before repository writes.

## Boundary With M3

M2 schedules and persists work but does not download website pages.

A crawl can now enter `RUNNING`, pause, resume, cancel, restore, and expose its queue safely. M3 will add the processing loop that dequeues approved tasks, fetches HTML, classifies responses, discovers links, and returns newly discovered URLs through M1 safety before queue insertion.

## Next Target

**M3 — Page Fetching and Link Discovery**.
