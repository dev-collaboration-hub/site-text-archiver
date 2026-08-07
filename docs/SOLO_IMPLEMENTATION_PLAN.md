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

Maintained verification layers include:

- Scratch JavaScript browser test harness
- Pure unit tests
- Module contract tests
- Mocked persistence/runtime tests
- Service-worker restart-recovery tests
- Dependency-free Node verification in GitHub Actions
- IndexedDB-backed runtime implementation with manual Chrome acceptance still pending
- Deterministic archive/golden-style tests
- Future local crawl-site fixtures
- Manual Chrome extension acceptance instructions

M0 manual verification remains tracked in `M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.

## 8. No External Dependency Rule

The implementation must not depend on:

- npm packages
- External JavaScript libraries
- Hosted AI models
- Online LLM APIs
- Backend servers
- Cloud databases
- Remote analytics

Permitted foundations include standard JavaScript, URL and Fetch APIs, IndexedDB, Web Workers, Chrome Extension APIs, and browser-native Web Crypto. HTML parsing and export formatting remain scratch-built rather than relying on third-party parser/export libraries.

## 9. Current Implementation State

### M0 — Extension foundation

Implemented. Chrome load-unpacked and manual persistence acceptance remain to be recorded.

### M1 — URL intelligence and safety

Implemented and verified. Evidence: `M1_IMPLEMENTATION_REPORT.md`.

### M2 — Crawl queue and state machine

Implemented and verified. Evidence: `M2_IMPLEMENTATION_REPORT.md`.

### M3 — Page fetching and link discovery

Implemented and verified. Evidence: `M3_IMPLEMENTATION_REPORT.md`.

### M4 — Semantic content extraction

Implemented and verified. Evidence: `M4_IMPLEMENTATION_REPORT.md`.

### M5 — Markdown and JSON archive generation

Implemented and verified.

Primary source:

```text
src/export/markdown-escape.js
src/export/code-fence.js
src/export/table-renderer.js
src/export/markdown-converter.js
src/export/page-ordering.js
src/export/toc-builder.js
src/export/report-generator.js
src/export/archive-builder.js
src/export/file-names.js
src/export/download-adapter.js
```

M5 converts persisted PageRecords into deterministic combined Markdown, stable structured JSON, crawl/failure reports, and browser downloads. Export requires a terminal persisted crawl snapshot and never refetches source pages.

Verification:

```text
tests/unit/m5.test.js
tests/node/m5-verify.mjs
.github/workflows/m5-verify.yml
```

Evidence: `M5_IMPLEMENTATION_REPORT.md`.

## 10. Current Progress

```text
Documentation: 100% for the current approved scope
M0: implemented; manual Chrome acceptance pending
M1: implemented and verified
M2: implemented and verified
M3: implemented and verified
M4: implemented and automated verification passing
M5: implemented and automated verification passing; real Chrome download acceptance pending
Overall functional product: approximately 68%
Next target: M6 Offline Agent Controller and Quality System
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
