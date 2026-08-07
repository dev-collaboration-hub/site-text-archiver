# Site Text Archiver — Requirements Traceability

## 1. Purpose

This document maps product capabilities to milestones, source files, and verification evidence. A documented capability is not counted as implemented until working source and tests exist.

## 2. Status Meanings

- **Documented** — design exists; working behavior is not complete.
- **Implemented** — source exists and main behavior is present.
- **Verified** — deterministic automated, mocked-environment, or CI evidence passes.
- **Manual acceptance pending** — browser interaction still needs to be recorded.
- **Deferred** — intentionally outside the current functional-release boundary.

## 3. Capability Matrix

| Capability | Milestone | Implementation | Evidence | Current state |
|---|---:|---|---|---|
| Manifest V3 extension shell | M0 | `manifest.json`, `src/background/` | Chrome checklist | Implemented; manual acceptance pending |
| Shared results, IDs, and settings | M0 | `src/shared/`, `settings-store.js` | M0 unit tests | Verified; browser persistence pending |
| Popup and dashboard foundation | M0 | `popup/`, `dashboard/` | Manual render checks | Implemented; manual acceptance pending |
| URL resolution and canonicalization | M1 | M1 URL modules | M1 unit/edge tests | Verified |
| Origin/path/pattern/safety enforcement | M1 | M1 scope modules | M1 scope/safety tests | Verified |
| Duplicate URL intelligence | M1 | `duplicate-url-registry.js` | Duplicate/snapshot tests | Verified |
| Crawl configuration and lifecycle | M2 | M2 crawl modules | State/config tests | Verified |
| Deterministic persisted task queue | M2 | task/queue/store modules | Queue/recovery tests | Verified |
| Idempotent lifecycle commands | M2 | request cache/runtime controller | Replay tests | Verified |
| Bounded HTML fetching | M3 | `fetcher.js`, `response-classifier.js` | M3 tests | Verified |
| Link discovery and base/canonical handling | M3 | `link-discovery.js` | M3 scanner tests | Verified |
| Retry and permanent-failure classification | M3 | network crawler/response classifier | M3 tests | Verified |
| Redirect/discovered-link M1 safety | M3 | network crawler + M1 | Mocked processing flow | Verified |
| Fetched HTML persistence | M3 | `page-html-store.js` | Runtime integration | Implemented; browser IndexedDB acceptance pending |
| Manifest V3 alarm scheduling | M3/M4 | alarm adapter/service worker | Runtime integration | Implemented; browser acceptance pending |
| Inert scratch HTML parsing | M4 | `html-parser.js`, `dom-utils.js` | M4 browser tests + GitHub Actions | Verified |
| Unsafe/hidden DOM cleanup | M4 | `dom-cleaner.js` | M4 cleanup tests | Verified |
| Main-content selection | M4 | `main-content-detector.js` | Semantic-root preference tests | Verified |
| Heading/paragraph/link extraction | M4 | `content-extractor.js` | M4 semantic tests | Verified |
| Nested list preservation | M4 | `content-extractor.js` | M4 nested-list tests | Verified |
| Table and code-block preservation | M4 | `content-extractor.js` | Span/code tests | Verified |
| Page metadata extraction | M4 | `content-extractor.js` | M4 metadata tests | Verified |
| Deterministic PageRecord/hash creation | M4 | `page-record.js`, `extraction-pipeline.js` | Node CI and browser tests | Verified |
| PageRecord IndexedDB persistence | M4 | `page-record-store.js` | Runtime contract | Implemented; browser IndexedDB acceptance pending |
| Extraction state/restart recovery | M4 | `extraction-runner.js`, `crawl-store.js`, runtime controller | M4 runner + recovery behavior | Verified |
| Markdown and JSON archive export | M5 | planned `src/export/` | Golden archive tests | Documented |
| Offline agent quality and bounded recovery | M6 | planned `src/agent/`, `src/quality/` | Deterministic scoring/decision tests | Documented |
| Local search index | M7 | planned `src/search/` | Ranking/index tests | Documented |
| Extractive local question answering | M8 | planned `src/qa/` | Passage/evidence tests | Documented |
| Complete dashboard and functional release | M9 | UI/release artifacts | End-to-end browser acceptance | Documented |
| Security/privacy hardening beyond baseline | Deferred | future hardening | Separate review plan | Deferred |

## 4. Milestone Evidence

- M1: `M1_IMPLEMENTATION_REPORT.md`
- M2: `M2_IMPLEMENTATION_REPORT.md`
- M3: `M3_IMPLEMENTATION_REPORT.md`
- M4: `M4_IMPLEMENTATION_REPORT.md`

M4 automated evidence includes:

```text
tests/unit/m4.test.js
tests/node/m4-verify.mjs
.github/workflows/m4-verify.yml
```

The dependency-free GitHub Actions verification executes the committed scratch parser, cleaner, main-content detector, semantic extractor, PageRecord builder, SHA-256 hashing, and preliminary Markdown derivation.

## 5. Deferred M4-adjacent Capabilities

The following are not falsely counted as M4 completion:

- Cross-page boilerplate-frequency scoring
- Exact/near duplicate-content analysis
- Quality score/band decisions
- Quality-driven extraction retry policy

Those remain M6 responsibilities.

## 6. Current State

```text
Documentation foundation: 100% for current approved scope
M0: implemented; manual Chrome acceptance pending
M1: implemented and verified
M2: implemented and verified
M3: implemented and verified; browser network acceptance pending
M4: implemented and automated verification passing; browser IndexedDB/UI acceptance pending
Functional product completion: approximately 58%
Next target: M5 Markdown and JSON Archive Generation
```
