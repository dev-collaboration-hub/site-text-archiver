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
- Explicit semantic-root preference with body fallback
- Heading hierarchy and heading paths
- Paragraphs with inline code and links
- Ordered/unordered nested lists
- Table normalization with simple span expansion and warnings
- Code-block whitespace and language-hint preservation
- Blockquotes, callouts, horizontal rules, and useful image alt text
- Title, description, author, language, and canonical metadata
- Deterministic plain text and preliminary Markdown
- Browser-native SHA-256 content and structure hashes
- IndexedDB PageRecord persistence
- Persisted `FETCHED -> EXTRACTING -> EXTRACTED` flow
- Raw fetched-HTML cleanup after successful extraction
- Extraction restart recovery after Manifest V3 worker interruption
- Dashboard extraction counts and page summaries

### Acceptance Results

- Extracted content preserves technical order and structure.
- Code blocks remain separate and preserve whitespace.
- Tables retain row/column order and simple spans are normalized.
- Explicit main/article roots are preferred over navigation-heavy body fallback.
- Hidden/executable markup does not participate in extraction.
- Raw HTML is not copied into PageRecords.
- Exact committed M4 extraction code passes dependency-free GitHub Actions verification.

### Deferred Boundary

Cross-page boilerplate scoring, duplicate-content classification, and quality scoring remain in M6 rather than being falsely counted as M4.

### Product Completion

58%

---

## M5 — Markdown and JSON Archive Generation

### Goal

Generate deterministic, source-backed archives from extracted PageRecords.

### Deliverables

- Stable PageRecord ordering
- Final page-to-Markdown conversion
- Heading-level normalization for combined documents
- Source URL blocks
- Table of contents
- Combined Markdown archive
- Structured JSON archive
- Crawl report
- Failed-page report
- Browser download integration

### Acceptance Criteria

- The same stored crawl produces the same export.
- Markdown renders correctly.
- Every exported page remains source-linked.

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

**M5 — Markdown and JSON Archive Generation**.
