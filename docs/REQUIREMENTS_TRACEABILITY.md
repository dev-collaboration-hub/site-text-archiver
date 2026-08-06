# Site Text Archiver — Requirements Traceability

## 1. Purpose

This document connects each major product capability to:

- Its delivery milestone
- Its primary design documents
- Its expected implementation area
- Its required verification evidence

The matrix prevents features from being marked complete based only on documentation or placeholder source files.

## 2. Traceability Rules

A capability is complete only when all applicable columns are satisfied:

1. The requirement is defined.
2. The architecture or algorithm is documented.
3. Working source code exists.
4. Automated tests exist and pass where technically practical.
5. Required manual browser verification is recorded.
6. User-facing documentation matches actual behavior.

Status values used during implementation:

- **Documented** — design exists, but working behavior is not yet complete.
- **Implemented** — source exists and main behavior is present.
- **Verified** — required automated and manual evidence is complete.
- **Deferred** — intentionally outside the current functional-release boundary.

## 3. Product Capability Matrix

| Capability | Milestone | Primary design authority | Expected implementation area | Required evidence | Current state |
|---|---:|---|---|---|---|
| Manifest V3 extension shell | M0 | `ARCHITECTURE.md`, `MODULE_SPECIFICATIONS.md` | `manifest.json`, `src/background/` | Syntax checks and Chrome load-unpacked acceptance | Implemented; manual acceptance pending |
| Shared result contract and identifiers | M0 | `API_MESSAGE_DATA_CONTRACTS.md` | `src/shared/` | Pure unit tests | Verified locally |
| Runtime message validation | M0 | `API_MESSAGE_DATA_CONTRACTS.md` | `src/messaging/` | Valid/invalid message tests | Verified locally |
| Settings validation and persistence | M0 | `MODULE_SPECIFICATIONS.md`, `API_MESSAGE_DATA_CONTRACTS.md` | `src/storage/`, popup | Unit tests plus browser restart persistence check | Implemented; browser persistence pending |
| Popup and dashboard foundation | M0 | `UI_USER_FLOW_SPECIFICATION.md` | `popup/`, `dashboard/` | Manual open/render/console checks | Implemented; manual acceptance pending |
| URL resolution and canonicalization | M1 | `ALGORITHMS_AND_PSEUDOCODE.md`, `API_MESSAGE_DATA_CONTRACTS.md` | `src/crawler/url-resolver.js`, `url-normalizer.js`, `query-policy.js`, `url-intelligence.js` | URL equivalence, query-policy, Unicode, encoding, and rejection-reason tests | Verified locally |
| Origin, path, pattern, limit, and unsafe-link enforcement | M1 | `PROJECT_SPECIFICATION.md`, `MODULE_SPECIFICATIONS.md` | `src/crawler/scope-guard.js`, `link-safety.js`, `blocked-extensions.js` | Out-of-scope, include/exclude, limit, download, and action-link tests | Verified locally |
| Duplicate URL registry | M1 | `ALGORITHMS_AND_PSEUDOCODE.md` | `src/crawler/duplicate-url-registry.js` | Circular-equivalence, duplicate-state, and snapshot tests | Verified locally |
| Deterministic crawl queue | M2 | `ARCHITECTURE.md`, `ALGORITHMS_AND_PSEUDOCODE.md` | `src/crawl/` | Queue-order and priority tests | Documented |
| Crawl state machine | M2 | `API_MESSAGE_DATA_CONTRACTS.md`, `ALGORITHMS_AND_PSEUDOCODE.md` | `src/crawl/` | Valid and invalid transition tests | Documented |
| Persisted resumable crawl state | M2 | `ARCHITECTURE.md`, `MODULE_SPECIFICATIONS.md` | `src/storage/`, `src/crawl/` | IndexedDB integration and worker-restart tests | Documented |
| Pause, resume, and cancel | M2 | `UI_USER_FLOW_SPECIFICATION.md`, contracts | background runtime and dashboard | State-transition plus manual control tests | Documented |
| Bounded HTML fetching | M3 | `MODULE_SPECIFICATIONS.md`, algorithms | `src/fetch/` | Timeout, content-type, and response-classification tests | Documented |
| Link discovery and base URL handling | M3 | algorithms and contracts | `src/discovery/` | Fixture-site discovery tests | Documented |
| Failure and retry classification | M3 | contracts and algorithms | `src/fetch/`, `src/crawl/` | Temporary/permanent failure tests | Documented |
| DOM cleanup and main-content selection | M4 | `ALGORITHMS_AND_PSEUDOCODE.md` | `src/extraction/` | HTML fixture and golden-output tests | Documented |
| Structured headings, paragraphs, and lists | M4 | module and algorithm specifications | `src/extraction/` | Golden structured-content tests | Documented |
| Table and code-block preservation | M4 | project and extraction specifications | `src/extraction/` | Complex fixture tests | Documented |
| Page metadata and extraction warnings | M4 | data contracts | `src/extraction/` | Contract and warning tests | Documented |
| Deterministic Markdown export | M5 | algorithms and data contracts | `src/export/` | Golden Markdown output | Documented |
| Structured JSON export | M5 | data contracts | `src/export/` | Schema and golden JSON tests | Documented |
| Crawl and failed-page reports | M5 | product and UI specifications | `src/export/`, dashboard | Report fixture tests and manual download check | Documented |
| Offline planning and page prioritization | M6 | architecture and algorithms | `src/agent/` | Deterministic decision tests | Documented |
| Content quality and duplicate scoring | M6 | algorithms | `src/quality/` | Score-boundary fixture tests | Documented |
| Bounded recovery manager | M6 | algorithms and contracts | `src/agent/`, `src/crawl/` | Retry-limit and reason-code tests | Documented |
| Final archive validation | M6 | testing strategy and algorithms | `src/quality/` | Invalid archive and warning tests | Documented |
| Tokenization and text normalization | M7 | algorithms | `src/search/` | Language/technical-token fixture tests | Documented |
| Inverted index and heading weighting | M7 | algorithms and module specifications | `src/search/` | Ranking and deterministic-index tests | Documented |
| Search snippets and source filters | M7 | UI and data contracts | `src/search/`, dashboard | Search fixture tests and manual UI test | Documented |
| Extractive question answering | M8 | algorithms and project specification | `src/qa/` | Passage-ranking and evidence tests | Documented |
| Source attribution and confidence | M8 | data contracts and UI specification | `src/qa/`, dashboard | Multi-source and confidence tests | Documented |
| Insufficient-evidence response | M8 | project specification and algorithms | `src/qa/` | Unsupported-question tests | Documented |
| Full dashboard workflow | M9 | `UI_USER_FLOW_SPECIFICATION.md` | `dashboard/` | End-to-end browser acceptance | Documented |
| Accessibility and usability pass | M9 | UI specification and testing strategy | popup and dashboard | Keyboard, focus, labels, and contrast checks | Documented |
| Performance profiling | M9 | scratch standard and testing strategy | complete pipeline | Representative crawl measurements | Documented |
| Functional release checklist | M9 | roadmap and testing strategy | release artifacts | Complete automated/manual evidence bundle | Documented |
| Security and privacy hardening beyond functional baseline | Deferred | `DEFERRED_SECURITY_PRIVACY_WORK.md` | future hardening work | Separate review and test plan | Deferred |

## 4. M0 Evidence Register

### Source present

- `manifest.json`
- `src/background/service-worker.js`
- `src/messaging/message-types.js`
- `src/messaging/message-validator.js`
- `src/messaging/runtime-client.js`
- `src/shared/constants.js`
- `src/shared/result.js`
- `src/shared/id.js`
- `src/storage/settings-store.js`
- Popup and dashboard files
- Scratch browser test harness

### Automated evidence reported

- JavaScript syntax checks
- Shared result-contract smoke tests
- Identifier-helper smoke tests
- Settings normalization and validation smoke tests
- Message-contract smoke tests

### Manual evidence still required

The steps and recording format are defined in `M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.

M0 must not be marked fully verified until these checks are completed in Chrome.

## 5. M1 Evidence Register

### Source present

- `src/crawler/query-policy.js`
- `src/crawler/url-resolver.js`
- `src/crawler/url-normalizer.js`
- `src/crawler/blocked-extensions.js`
- `src/crawler/link-safety.js`
- `src/crawler/scope-guard.js`
- `src/crawler/duplicate-url-registry.js`
- `src/crawler/url-intelligence.js`
- Include/exclude settings and popup integration

### Automated evidence

- `tests/unit/index.test.js`
- `tests/unit/m1-edge.test.js`
- Local Node ES-module verification of the core pipeline

The tests cover resolution, canonicalization, query policy, boundaries, unsafe actions, blocked files, resource limits, duplicate detection, Unicode, encoded paths, and integrated classification.

### Evidence report

Full M1 implementation details and limitations are recorded in `M1_IMPLEMENTATION_REPORT.md`.

M1 is verified as a pure URL-decision layer. M2 and M3 must use this layer as their queue-admission and discovered-link safety gate.

## 6. Milestone Update Procedure

When work begins on a milestone:

1. Change relevant rows from **Documented** to **Implemented** only after working source exists.
2. Add exact source paths if the final structure differs from the expected area.
3. Add test paths and evidence references.
4. Change rows to **Verified** only after all required checks pass.
5. Record limitations rather than silently weakening the acceptance criteria.
6. Update `ROADMAP.md` and `README.md` with the same product-progress state.

## 7. Completion Interpretation

The presence of every row in this matrix means the product scope is traceable, not implemented.

Current high-level state:

```text
Documentation foundation: complete for current approved scope
Working product: M0 foundation plus verified M1 URL intelligence
Functional product completion: approximately 20%
Current implementation target: M2 Crawl Queue and State Machine
```
