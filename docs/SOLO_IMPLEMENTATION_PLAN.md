# Site Text Archiver — Solo Implementation Plan

## 1. Purpose

This document defines how Site Text Archiver is completed through a single-owner, milestone-by-milestone workflow.

- **Product direction:** Dilip Singh
- **Implementation execution:** ChatGPT
- **Repository:** `dev-collaboration-hub/site-text-archiver`
- **Primary branch:** `main`
- **Build style:** scratch-built with browser-native capabilities

## 2. Working Rules

1. Implement one milestone at a time.
2. Do not count documentation as working product code.
3. Do not mark placeholder behavior complete.
4. Keep core algorithms independent of Chrome APIs where practical.
5. Use no npm packages or external JavaScript libraries.
6. Persist important runtime state because Manifest V3 workers may stop.
7. Add tests with every functional module.
8. Fix failures before claiming milestone completion.
9. Keep documentation synchronized with real behavior.
10. Report browser-verification limitations honestly.

## 3. Implementation Sequence

```text
Documentation foundation
-> M0 extension foundation
-> M1 URL intelligence
-> M2 queue and persisted state
-> M3 fetching and discovery
-> M4 semantic extraction
-> M5 archive export
-> M6 offline agent and quality
-> M7 local search
-> M8 extractive question answering
-> M9 dashboard and functional release
```

## 4. Milestone Execution Loop

```text
Inspect repository
-> compare source with contracts
-> implement the smallest complete slice
-> add tests
-> run available verification
-> fix failures
-> update evidence and progress
-> advance to the next milestone
```

## 5. Definition of Done

A module is complete only when:

- Its intended source exists.
- Public functions match documented contracts.
- Main behavior works.
- Invalid input is handled with reason codes.
- Relevant tests exist and pass in the available environment.
- Remaining manual browser checks are clearly disclosed.
- No unfinished placeholder is presented as complete.

## 6. Repository Write Policy

- Work directly on `main` for the current single-owner workflow.
- Fetch an existing file before replacing it.
- Use clear, scoped commit messages.
- Keep unrelated changes separate.
- Verify updated files after writes.
- Preserve stable documentation and contract paths.

## 7. Testing Policy

The maintained verification layers include:

- Scratch JavaScript browser test harness
- Pure unit tests
- Module contract tests
- Mocked persistence tests
- Service-worker restart-recovery tests
- Future IndexedDB integration tests
- Future local crawl-site fixtures
- Future golden Markdown and JSON outputs
- Manual Chrome extension acceptance instructions

M0 manual verification is tracked in `M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.

## 8. No External Dependency Rule

The implementation must not depend on:

- npm packages
- External JavaScript libraries
- Hosted AI models
- Online LLM APIs
- Backend servers
- Cloud databases
- Remote analytics

Permitted foundations include standard JavaScript, URL and Fetch APIs, DOMParser, IndexedDB, Web Workers, Chrome Extension APIs, and browser-native Web Crypto.

## 9. Current Implementation State

### M0 — Extension foundation

Implemented. Chrome load-unpacked and manual persistence acceptance remain to be recorded.

### M1 — URL intelligence and safety

Implemented and locally verified. Evidence: `M1_IMPLEMENTATION_REPORT.md`.

### M2 — Crawl queue and state machine

Implemented and locally verified.

Primary M2 source:

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

Verification:

```text
tests/unit/m2.test.js
tests/unit/m2-recovery.test.js
```

M2 provides deterministic scheduling, persisted lifecycle controls, idempotent commands, progress statistics, and service-worker restart repair. It does not fetch pages; that begins in M3.

Evidence: `M2_IMPLEMENTATION_REPORT.md`.

## 10. Current Progress

```text
Documentation: 100% for the current approved scope
M0: implemented; manual Chrome acceptance pending
M1: implemented and locally verified
M2: implemented and locally verified
Overall functional product: approximately 32%
Next target: M3 Page Fetching and Link Discovery
```

## 11. Completion Objective

The final extension must:

- Crawl bounded documentation sites
- Extract structured content
- Resume interrupted work
- Export Markdown and JSON
- Build a local search index
- Return source-backed extractive answers
- Provide a usable popup and dashboard
