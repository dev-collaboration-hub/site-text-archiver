# Site Text Archiver — Development Roadmap

## 1. Execution Model

This roadmap is executed through a single-owner workflow.

- Dilip Singh defines project goals, constraints, and priorities.
- ChatGPT performs documentation, implementation, tests, debugging, progress review, and repository updates.
- Work proceeds directly milestone by milestone on `main`.

## 2. Progress Rules

A milestone is complete only when:

- Required source files exist.
- Main behavior works.
- Required tests exist and pass where executable verification is available.
- Errors are explicit.
- Documentation matches implementation.
- No placeholder or unchecked claim is counted as complete.

Progress percentages represent working product capability, not documentation volume.

---

## M0 — Project Foundation

**Status:** Implemented; Chrome load-unpacked acceptance remains to be manually recorded.

**Product completion:** 10%

---

## M1 — URL Intelligence and Safety

**Status:** Implemented and verified.

Evidence: `M1_IMPLEMENTATION_REPORT.md`.

**Product completion:** 20%

---

## M2 — Crawl Queue and State Machine

**Status:** Implemented and verified.

Evidence: `M2_IMPLEMENTATION_REPORT.md`.

**Product completion:** 32%

---

## M3 — Page Fetching and Link Discovery

**Status:** Implemented and verified.

Evidence: `M3_IMPLEMENTATION_REPORT.md`.

Delivered bounded HTML fetching, retry classification, redirect revalidation, scratch-built link discovery, IndexedDB fetched-HTML storage, M1 admission checks, and Manifest V3 alarm-driven processing.

**Product completion:** 43%

---

## M4 — Semantic Content Extraction

### Status

**Implemented and verified with repository regression tests and dependency-free GitHub Actions execution.**

Evidence: `M4_IMPLEMENTATION_REPORT.md`.

### Delivered

- Scratch-built inert HTML AST parser
- Deterministic DOM cleaning and hidden-node removal
- Evidence-based main-content detection
- Heading/paragraph/link extraction
- Ordered/unordered nested lists
- Table normalization with simple span expansion
- Code-block whitespace/language preservation
- Blockquotes, callouts, horizontal rules, and useful image alt text
- Page metadata and canonical URLs
- Browser-native SHA-256 hashes
- IndexedDB PageRecord persistence
- Restart-safe extraction state

### Product Completion

58%

---

## M5 — Markdown and JSON Archive Generation

### Status

**Implemented and verified with browser regression coverage and dependency-free GitHub Actions export verification.**

Evidence: `M5_IMPLEMENTATION_REPORT.md`.

### Delivered

- Stable start-page/navigation/depth/discovery/URL ordering
- Final semantic-block-to-Markdown conversion
- Combined-document heading normalization
- Safe inline and block code rendering
- Code fences longer than embedded backtick runs
- Markdown table escaping
- Per-page source URL blocks
- Stable duplicate-title TOC labels and anchors
- Combined Markdown archive
- Recursively stable-sorted structured JSON archive
- Crawl report with state, bytes, retries, reason codes, and warnings
- Conditional failed-page report
- Stable terminal-snapshot export boundary
- Empty-archive rejection
- `EXPORT_ARCHIVE` runtime command
- Browser `downloads` integration
- Filename/path traversal sanitization
- Dashboard archive-download control

### Acceptance Results

- Identical persisted input produces identical export file bytes in automated verification.
- Start-page ordering and deterministic tie-breaking are tested.
- Every exported page includes its source URL.
- Duplicate page titles receive unique TOC anchors.
- Embedded backticks and table pipes render safely.
- Failed/skipped task reason codes remain visible in the failure report.
- Mocked browser-download integration emits the expected supported files.

### Manual Browser Boundary

Real Chrome `Load unpacked`, IndexedDB-to-download click flow, and very-large-export browser behavior remain explicit manual/reliability acceptance items.

### Product Completion

68%

---

## M6 — Offline Agent Controller and Quality System

### Goal

Add deterministic planning, cross-page boilerplate/duplicate analysis, quality scoring, and bounded recovery decisions.

### Product Completion

78%

---

## M7 — Local Search Index

### Goal

Make archived documentation searchable without external services.

### Product Completion

87%

---

## M8 — Extractive Local Question Answering

### Goal

Answer questions using only archived evidence.

### Product Completion

93%

---

## M9 — Dashboard, Reliability, and Functional Release

### Goal

Complete the user experience, reliability checks, and functional release preparation.

### Product Completion

100%

---

## Build Order

```text
M0 Foundation
-> M1 URL Intelligence
-> M2 Queue and State
-> M3 Fetch and Discovery
-> M4 Extraction
-> M5 Export
-> M6 Agent and Quality
-> M7 Local Search
-> M8 Question Answering
-> M9 Functional Release
```

## Current Next Target

**M6 — Offline Agent Controller and Quality System**.
