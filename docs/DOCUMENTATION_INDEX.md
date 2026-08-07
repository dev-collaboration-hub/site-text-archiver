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

### Execution and deferred work

16. `docs/SOLO_IMPLEMENTATION_PLAN.md`
17. `docs/DEFERRED_SECURITY_PRIVACY_WORK.md`

## 3. Document Responsibilities

| Document | Primary responsibility | Authority |
|---|---|---|
| `README.md` | Repository overview, current status, installation, and usage | Summary |
| `PROJECT_SPECIFICATION.md` | Product goals, functional scope, constraints, and success criteria | Product requirements |
| `ROADMAP.md` | Milestone sequence, acceptance criteria, and product progress | Delivery plan |
| `ARCHITECTURE.md` | Runtime components, data flow, and architectural decisions | System design |
| `MODULE_SPECIFICATIONS.md` | Module responsibilities, interfaces, and completion criteria | Module design |
| `API_MESSAGE_DATA_CONTRACTS.md` | Runtime messages, data records, result shapes, and reason codes | Interface contract |
| `ALGORITHMS_AND_PSEUDOCODE.md` | Deterministic algorithms, scoring, and transitions | Algorithm design |
| `SCRATCH_DEVELOPMENT_STANDARD.md` | No-dependency engineering rules and implementation constraints | Engineering standard |
| `TESTING_STRATEGY.md` | Test layers, fixtures, coverage, and release evidence | Verification strategy |
| `REQUIREMENTS_TRACEABILITY.md` | Capability-to-source and capability-to-test mapping | Traceability control |
| `UI_USER_FLOW_SPECIFICATION.md` | Popup, dashboard, states, actions, and feedback | UX contract |
| `M0_BROWSER_ACCEPTANCE_CHECKLIST.md` | Manual Chrome verification | M0 acceptance evidence |
| `M1_IMPLEMENTATION_REPORT.md` | M1 URL intelligence evidence | M1 evidence |
| `M2_IMPLEMENTATION_REPORT.md` | M2 queue, lifecycle, persistence, and recovery evidence | M2 evidence |
| `M3_IMPLEMENTATION_REPORT.md` | M3 fetching, response classification, link discovery, scheduling, and persistence evidence | M3 evidence |
| `SOLO_IMPLEMENTATION_PLAN.md` | Execution loop, definition of done, and repository policy | Execution policy |
| `DEFERRED_SECURITY_PRIVACY_WORK.md` | Deferred hardening tasks and release boundaries | Deferred scope register |

## 4. Source-of-Truth Order

1. Product behavior and scope: `PROJECT_SPECIFICATION.md`
2. Milestone status and sequence: `ROADMAP.md`
3. Public interfaces and stored data: `API_MESSAGE_DATA_CONTRACTS.md`
4. Module boundaries: `MODULE_SPECIFICATIONS.md`
5. Algorithm details: `ALGORITHMS_AND_PSEUDOCODE.md`
6. Test requirements: `TESTING_STRATEGY.md`
7. UI behavior: `UI_USER_FLOW_SPECIFICATION.md`
8. Implemented evidence: milestone implementation reports

## 5. Current Status

**Documentation foundation: 100% for the current approved scope.**

```text
M0: source foundation implemented; manual Chrome acceptance pending
M1: URL intelligence and safety implemented and locally verified
M2: crawl queue and state machine implemented and locally verified
M3: page fetching and link discovery implemented and locally verified
Functional product completion: approximately 43%
Next target: M4 Semantic Content Extraction
```

M3 now performs the real bounded network crawl and stores accepted HTML locally. Semantic extraction begins in M4.

## 6. Synchronization Policy

Every milestone must update documentation when it changes public interfaces, stored records, reason codes, state transitions, limits, user-visible workflows, acceptance criteria, or known limitations.

Documentation completeness must never be used as a substitute for working product completion.
