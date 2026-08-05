# Site Text Archiver — Development Roadmap

## 1. Execution Model

This roadmap is executed through a single-owner workflow.

- Dilip Singh defines project goals, constraints, and priorities.
- ChatGPT performs documentation, implementation, tests, debugging, progress review, and repository updates.
- The project is not being divided among contributors.
- No contribution guide, assignment board, or contributor onboarding is required for the current build.
- Work proceeds directly milestone by milestone on `main`.

## 2. Progress Rules

A milestone is complete only when:

- Its required source files exist.
- Its main behavior works.
- Required tests are implemented and passing.
- Errors are returned clearly.
- Documentation matches the implementation.
- No placeholder, empty function, mock-only path, or unchecked claim is counted as complete.

Progress percentages represent working product capability, not documentation volume.

---

## M0 — Project Foundation

### Status

**Implemented in source. Browser installation acceptance remains to be manually confirmed.**

### Goal

Create an installable Chrome Manifest V3 extension skeleton and the shared foundation needed by later modules.

### Implemented Deliverables

- `manifest.json`
- Background service worker
- Popup configuration interface
- Dashboard foundation
- Shared constants
- Result and identifier helpers
- Typed message foundation
- Settings validation and local persistence
- Scratch browser test harness
- MIT license
- Solo implementation documentation

### Verification Completed

- JavaScript syntax checks passed locally.
- Result-contract smoke tests passed.
- Identifier-helper smoke tests passed.
- Settings normalization and validation smoke tests passed.
- Message-contract smoke tests passed.

### Remaining Acceptance

- Load unpacked in Chrome.
- Confirm popup opens without console errors.
- Confirm dashboard opens.
- Confirm settings persist after browser restart.

### Estimated Product Completion

10%

---

## M1 — URL Intelligence and Safety

### Goal

Build URL normalization, origin/path validation, include/exclude filtering, file-extension filtering, and duplicate URL intelligence.

### Deliverables

- URL resolver
- Canonical URL normalizer
- Origin and path guard
- Include and exclude pattern support
- Blocked extension list
- Unsafe action-link detector
- Duplicate URL registry
- Machine-readable decision reasons

### Required Tests

- Relative and absolute URLs
- Fragments
- Default ports
- Query parameters
- Trailing slash handling
- Out-of-origin URLs
- Out-of-path URLs
- Unsupported protocols
- Account-action links
- Circular URLs

### Acceptance Criteria

- Equivalent URLs resolve to one canonical key.
- Every rejected URL has an explicit reason.
- Out-of-scope links cannot enter the crawl queue.

### Estimated Product Completion

20%

---

## M2 — Crawl Queue and State Machine

### Goal

Create deterministic crawl scheduling and resumable state management.

### Deliverables

- Crawl state machine
- Priority task queue
- Crawl configuration validation
- Page, depth, delay, and retry limits
- Pause, resume, cancel controls
- Persisted queue state
- Crawl statistics
- Progress events

### Acceptance Criteria

- Queue order is deterministic.
- Invalid state transitions are rejected.
- Restarting the service worker does not lose completed tasks.

### Estimated Product Completion

32%

---

## M3 — Page Fetching and Link Discovery

### Goal

Fetch allowed HTML pages and discover new documentation links.

### Deliverables

- Fetch timeout handling
- Response classification
- HTML content-type validation
- Request delay policy
- Link extraction
- Base URL handling
- Canonical-link awareness
- Fetch failure records
- Retry classification

### Acceptance Criteria

- Only approved HTML pages are processed.
- Temporary and permanent failures are classified separately.
- Newly discovered links pass normalization and scope checks.

### Estimated Product Completion

43%

---

## M4 — Semantic Content Extraction

### Goal

Extract useful documentation content while preserving technical structure.

### Deliverables

- DOM cleanup
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

### Estimated Product Completion

58%

---

## M5 — Markdown and JSON Archive Generation

### Goal

Generate deterministic, source-backed archives.

### Deliverables

- Page-to-Markdown converter
- Stable page ordering
- Heading-level normalization
- Source URL blocks
- Table of contents
- Combined Markdown export
- Structured JSON export
- Crawl report
- Failed-page report
- Browser download integration

### Acceptance Criteria

- The same stored crawl produces the same export.
- Markdown renders correctly.
- Every page retains its source URL.

### Estimated Product Completion

68%

---

## M6 — Offline Agent Controller and Quality System

### Goal

Add deterministic planning, quality scoring, and bounded recovery decisions.

### Deliverables

- Agent controller
- Initial crawl planner
- Page priority scoring
- Content quality scoring
- Duplicate-content detector
- Boilerplate detector
- Recovery manager
- Final archive validator
- Decision event log

### Acceptance Criteria

- Every agent decision includes evidence and a reason code.
- Retry behavior is bounded.
- Low-quality content is flagged rather than silently accepted.

### Estimated Product Completion

78%

---

## M7 — Local Search Index

### Goal

Make archived documentation searchable without external services.

### Deliverables

- Tokenizer
- Text normalizer
- Stop-word policy
- Section splitter
- Inverted index
- Heading weighting
- Document-frequency statistics
- Phrase preference
- Search result snippets
- Source filters

### Acceptance Criteria

- Search returns relevant sections.
- Heading matches receive appropriate weight.
- Results are deterministic and source-linked.

### Estimated Product Completion

87%

---

## M8 — Extractive Local Question Answering

### Goal

Answer questions using only archived evidence.

### Deliverables

- Question tokenizer
- Query-term weighting
- Candidate retrieval
- Passage ranking
- Answer passage extraction
- Multiple-source support
- Confidence indicators
- Insufficient-evidence response
- Source attribution

### Acceptance Criteria

- Answers cite source pages.
- Unsupported questions return insufficient evidence.
- The engine does not invent missing facts.

### Estimated Product Completion

93%

---

## M9 — Dashboard, Reliability, and Functional Release

### Goal

Complete the user experience, reliability checks, and functional release preparation.

### Deliverables

- Full crawl dashboard
- Queue visualization
- Failed/skipped inspection
- Quality report UI
- Search UI
- Question-answering UI
- Export controls
- Accessibility pass
- Performance profiling
- Example archives
- Installation and usage documentation
- Functional release checklist

Dedicated security and privacy hardening remains deferred to `DEFERRED_SECURITY_PRIVACY_WORK.md`.

### Acceptance Criteria

- A non-developer can install and use the extension.
- A complete crawl can be inspected and exported.
- Interrupted sessions do not corrupt completed data.
- Core workflows have automated and manual test evidence.

### Estimated Product Completion

100%

---

## Recommended Build Order

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

M1 URL Intelligence and Safety.
