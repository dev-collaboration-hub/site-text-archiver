# Site Text Archiver — Documentation Index

## 1. Purpose

This file is the authoritative entry point for the Site Text Archiver documentation set. Working product completion is tracked separately in `ROADMAP.md`.

## 2. Recommended Reading Order

### Product orientation

1. `README.md`
2. `docs/PROJECT_SPECIFICATION.md`
3. `docs/ROADMAP.md`
4. `docs/ARCHITECTURE.md`

### Implementation preparation

5. `docs/MODULE_SPECIFICATIONS.md`
6. `docs/API_MESSAGE_DATA_CONTRACTS.md`
7. `docs/ALGORITHMS_AND_PSEUDOCODE.md`
8. `docs/SCRATCH_DEVELOPMENT_STANDARD.md`

### Verification and implementation evidence

9. `docs/TESTING_STRATEGY.md`
10. `docs/REQUIREMENTS_TRACEABILITY.md`
11. `docs/UI_USER_FLOW_SPECIFICATION.md`
12. `docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md`
13. `docs/M1_IMPLEMENTATION_REPORT.md`
14. `docs/M2_IMPLEMENTATION_REPORT.md`
15. `docs/M3_IMPLEMENTATION_REPORT.md`
16. `docs/M4_IMPLEMENTATION_REPORT.md`
17. `docs/M5_IMPLEMENTATION_REPORT.md`

### Execution and deferred work

18. `docs/SOLO_IMPLEMENTATION_PLAN.md`
19. `docs/DEFERRED_SECURITY_PRIVACY_WORK.md`

## 3. Document Responsibilities

| Document | Primary responsibility | Authority |
|---|---|---|
| `README.md` | Repository overview, current status, installation, and usage | Summary |
| `PROJECT_SPECIFICATION.md` | Product goals, functional scope, constraints, and success criteria | Product requirements |
| `ROADMAP.md` | Milestone sequence, acceptance criteria, and product progress | Delivery plan |
| `ARCHITECTURE.md` | Runtime components, data flow, and architectural decisions | System design |
| `MODULE_SPECIFICATIONS.md` | Module responsibilities, interfaces, and completion criteria | Module design |
| `API_MESSAGE_DATA_CONTRACTS.md` | Baseline runtime messages, data records, result shapes, and reason codes | Interface contract |
| `ALGORITHMS_AND_PSEUDOCODE.md` | Deterministic algorithms, scoring, and transitions | Algorithm design |
| `SCRATCH_DEVELOPMENT_STANDARD.md` | No-dependency engineering rules and implementation constraints | Engineering standard |
| `TESTING_STRATEGY.md` | Test layers, fixtures, coverage, and release evidence | Verification strategy |
| `REQUIREMENTS_TRACEABILITY.md` | Capability-to-source and capability-to-test mapping | Traceability control |
| `UI_USER_FLOW_SPECIFICATION.md` | Popup, dashboard, states, actions, and feedback | UX contract |
| `M0_BROWSER_ACCEPTANCE_CHECKLIST.md` | Manual Chrome verification | M0 acceptance evidence |
| `M1_IMPLEMENTATION_REPORT.md` | M1 URL intelligence evidence | M1 evidence |
| `M2_IMPLEMENTATION_REPORT.md` | M2 queue, lifecycle, persistence, and recovery evidence | M2 evidence |
| `M3_IMPLEMENTATION_REPORT.md` | M3 fetching, response classification, link discovery, scheduling, and persistence evidence | M3 evidence |
| `M4_IMPLEMENTATION_REPORT.md` | M4 parsing, cleanup, main-content selection, semantic extraction, PageRecord persistence, tests, and CI evidence | M4 evidence |
| `M5_IMPLEMENTATION_REPORT.md` | M5 Markdown/JSON conversion, archive ordering, reports, runtime export, browser download integration, tests, and CI evidence | M5 evidence |
| `SOLO_IMPLEMENTATION_PLAN.md` | Execution loop, definition of done, and repository policy | Execution policy |
| `DEFERRED_SECURITY_PRIVACY_WORK.md` | Deferred hardening tasks and release boundaries | Deferred scope register |

## 4. Source-of-Truth Order

1. Product behavior and scope: `PROJECT_SPECIFICATION.md`
2. Milestone status and sequence: `ROADMAP.md`
3. Baseline public interfaces and stored data: `API_MESSAGE_DATA_CONTRACTS.md`
4. Implemented milestone-specific interface extensions: milestone implementation reports
5. Module boundaries: `MODULE_SPECIFICATIONS.md`
6. Algorithm details: `ALGORITHMS_AND_PSEUDOCODE.md`
7. Test requirements: `TESTING_STRATEGY.md`
8. UI behavior: `UI_USER_FLOW_SPECIFICATION.md`

If a newer implemented milestone introduces an interface not yet consolidated into the baseline contract document, its implementation report and source code define the current extension until the baseline contract is consolidated.

## 5. Current Status

**Documentation foundation: 100% for the current approved scope.**

```text
M0: source foundation implemented; manual Chrome acceptance pending
M1: URL intelligence and safety implemented and verified
M2: crawl queue and state machine implemented and verified
M3: page fetching and link discovery implemented and verified
M4: semantic content extraction implemented; dependency-free CI verification passing
M5: deterministic Markdown/JSON archive export implemented; dependency-free CI verification passing
Functional product completion: approximately 68%
Next target: M6 Offline Agent Controller and Quality System
```

The current runtime can crawl approved pages, extract semantic PageRecords, and export terminal crawl snapshots as source-backed Markdown/JSON/report files.

## 6. Synchronization Policy

Every milestone must update documentation when it changes public interfaces, stored records, reason codes, state transitions, limits, user-visible workflows, acceptance criteria, or known limitations.

Documentation completeness must never be used as a substitute for working product completion.
