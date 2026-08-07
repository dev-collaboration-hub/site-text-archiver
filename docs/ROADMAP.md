# Site Text Archiver — Development Roadmap

## 1. Execution Model

This roadmap is executed through a single-owner workflow.

- Dilip Singh defines project goals, constraints, and priorities.
- ChatGPT performs documentation, implementation, tests, debugging, progress review, and repository updates.
- Work proceeds directly milestone by milestone on `main`.

## 2. Progress Rules

A milestone is complete only when:

- Its required source files exist.
- Its main behavior works.
- Required tests are implemented.
- Errors are returned clearly.
- Documentation matches the implementation.
- No placeholder, empty function, mock-only path, or unchecked claim is counted as complete.

Progress percentages represent working product capability, not documentation volume.

---

## M0 — Project Foundation

### Status

**Implemented in source. Chrome load-unpacked acceptance remains to be manually recorded using `M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.**

### Product Completion

10%

---

## M1 — URL Intelligence and Safety

### Status

**Implemented and verified with pure-module tests.**

Evidence: `M1_IMPLEMENTATION_REPORT.md`.

### Product Completion

20%

---

## M2 — Crawl Queue and State Machine

### Status

**Implemented and verified with deterministic module, mocked-storage, command-flow, and restart-recovery tests.**

Evidence: `M2_IMPLEMENTATION_REPORT.md`.

### Product Completion

32%

---

## M3 — Page Fetching and Link Discovery

### Status

**Implemented with local pure-module and mocked processing-loop verification plus repository regression coverage.**

Evidence: `M3_IMPLEMENTATION_REPORT.md`.

### Delivered

- GET-only bounded page fetcher
- Timeout handling
- Cooperative active-fetch Pause/Cancel cancellation
- HTML content-type validation
- Content-Length and actual byte-size limits
- HTTP response classification
- Retry-After-aware retry scheduling
- Temporary/permanent failure separation
- Redirect final-URL M1 revalidation
- Scratch-built HTML start-tag scanner
- Base URL handling
- Canonical-link awareness
- Deterministic anchor/area link discovery
- M1 safety validation before queue insertion
- Fetch metadata records
- IndexedDB storage for downloaded HTML
- Manifest V3 alarm-driven network loop
- Per-origin optional host-permission request
- Dashboard fetched/skipped/failed progress

### Acceptance Results

- Only approved HTML responses are stored for extraction.
- Temporary network/server failures are retryable and permanent non-HTML/client failures are skipped or failed explicitly.
- Newly discovered links pass M1 normalization, origin/path/safety, depth, limit, and duplicate checks before queue insertion.
- Redirected final URLs are revalidated before acceptance.

### Runtime Boundary

M3 performs the real network crawl and leaves accepted tasks in `FETCHED` with source HTML stored locally. Semantic content extraction starts in M4.

### Product Completion

43%

---

## M4 — Semantic Content Extraction

### Goal

Extract useful documentation content while preserving technical structure.

### Deliverables

- DOM/HTML cleanup
- Main-content candidate detection
- Text-density scoring
- Heading hierarchy extraction
- Paragraph extraction
- Ordered and unordered lists
- Table conversion
- Code block preservation
- Relevant link preservation
- Page metadata extraction
- Extraction warnings

### Acceptance Criteria

- Extracted content remains readable and structurally correct.
- Code blocks and tables remain usable.
- Navigation and repeated interface content are substantially reduced.

### Product Completion

58%

---

## M5 — Markdown and JSON Archive Generation

### Goal

Generate deterministic, source-backed archives.

### Product Completion

68%

---

## M6 — Offline Agent Controller and Quality System

### Goal

Add deterministic planning, quality scoring, and bounded recovery decisions.

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

**M4 — Semantic Content Extraction**.
