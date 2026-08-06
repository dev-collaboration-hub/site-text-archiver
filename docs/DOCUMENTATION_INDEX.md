# Site Text Archiver — Documentation Index

## 1. Purpose

This file is the authoritative entry point for the Site Text Archiver documentation set.

It explains:

- Which document answers which question
- The recommended reading order
- Which documents define product requirements and contracts
- How implementation changes must be reflected in documentation
- The current documentation-completion state

The documentation describes the approved functional scope of the project. Working product completion is tracked separately in `ROADMAP.md`.

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

### Verification and user experience

9. `docs/TESTING_STRATEGY.md`
10. `docs/REQUIREMENTS_TRACEABILITY.md`
11. `docs/UI_USER_FLOW_SPECIFICATION.md`
12. `docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md`
13. `docs/M1_IMPLEMENTATION_REPORT.md`

### Execution and deferred work

14. `docs/SOLO_IMPLEMENTATION_PLAN.md`
15. `docs/DEFERRED_SECURITY_PRIVACY_WORK.md`

## 3. Document Responsibilities

| Document | Primary responsibility | Authority |
|---|---|---|
| `README.md` | Repository overview, current status, installation, and entry-level usage | Summary |
| `PROJECT_SPECIFICATION.md` | Product goals, functional scope, constraints, and success criteria | Product requirements |
| `ROADMAP.md` | Milestone sequence, milestone deliverables, acceptance criteria, and product progress | Delivery plan |
| `ARCHITECTURE.md` | System boundaries, runtime components, data flow, and architectural decisions | System design |
| `MODULE_SPECIFICATIONS.md` | Responsibilities, inputs, outputs, dependencies, and failure behavior of modules | Module design |
| `API_MESSAGE_DATA_CONTRACTS.md` | Runtime messages, public contracts, data records, result shapes, and reason codes | Interface contract |
| `ALGORITHMS_AND_PSEUDOCODE.md` | Deterministic algorithms, scoring rules, state transitions, and processing steps | Algorithm design |
| `SCRATCH_DEVELOPMENT_STANDARD.md` | No-dependency engineering rules, code quality rules, and implementation constraints | Engineering standard |
| `TESTING_STRATEGY.md` | Test layers, fixtures, expected coverage, manual verification, and release evidence | Verification strategy |
| `REQUIREMENTS_TRACEABILITY.md` | Mapping from product capabilities to milestones, implementation areas, and test evidence | Traceability control |
| `UI_USER_FLOW_SPECIFICATION.md` | Popup, dashboard, user actions, states, accessibility, and feedback behavior | UX contract |
| `M0_BROWSER_ACCEPTANCE_CHECKLIST.md` | Manual Chrome verification required to accept the M0 extension foundation | M0 acceptance evidence |
| `M1_IMPLEMENTATION_REPORT.md` | Implemented M1 source, reason codes, automated evidence, and M2/M3 integration boundary | M1 implementation evidence |
| `SOLO_IMPLEMENTATION_PLAN.md` | Single-owner workflow, definition of done, repository write policy, and execution loop | Execution policy |
| `DEFERRED_SECURITY_PRIVACY_WORK.md` | Explicitly deferred hardening tasks and release boundaries | Deferred scope register |

## 4. Source-of-Truth Rules

When documents overlap, use the following precedence:

1. Product behavior and scope: `PROJECT_SPECIFICATION.md`
2. Milestone completion and sequencing: `ROADMAP.md`
3. Public interfaces and stored data shapes: `API_MESSAGE_DATA_CONTRACTS.md`
4. Module boundaries: `MODULE_SPECIFICATIONS.md`
5. Algorithm details: `ALGORITHMS_AND_PSEUDOCODE.md`
6. Test evidence and verification requirements: `TESTING_STRATEGY.md`
7. UI behavior: `UI_USER_FLOW_SPECIFICATION.md`
8. Implemented milestone evidence: milestone implementation reports

If implementation and documentation disagree, the discrepancy must be recorded and corrected before the affected milestone is marked complete.

## 5. Documentation Completion Definition

The documentation foundation is complete when:

- Product scope is defined.
- Architecture and module boundaries are defined.
- Runtime and data contracts are defined.
- Core algorithms have deterministic pseudocode.
- Milestones and acceptance criteria are defined.
- Testing levels and evidence requirements are defined.
- UI states and user flows are defined.
- Requirements are traceable to implementation and tests.
- Manual M0 browser acceptance has a repeatable checklist.
- Completed milestones have implementation evidence.
- Deferred security and privacy work is explicitly separated from functional release scope.
- The documentation set has a central index and clear authority rules.

These conditions are documented for the current approved scope.

## 6. Current Documentation Status

**Documentation foundation: 100% for the current approved project scope.**

Current implementation evidence:

```text
M0: source foundation implemented; Chrome acceptance pending
M1: URL intelligence and safety implemented and pure-module verified
Overall functional product completion: approximately 20%
Next target: M2 Crawl Queue and State Machine
```

Documentation completeness does not mean the product is complete. Documentation must continue to be maintained as implementation reveals necessary contract corrections, measured limits, browser-specific behavior, or scope changes.

## 7. Synchronization Policy

Every implementation milestone must update documentation when it changes:

- A public function or message
- A stored record or schema
- A reason code
- A state transition
- A limit or default
- A user-visible workflow
- An acceptance criterion
- A known limitation

A milestone progress update must distinguish:

```text
Documentation status
Implementation status
Automated test status
Manual acceptance status
Overall functional product progress
```

Documentation completeness must never be used as a substitute for working product completion.
