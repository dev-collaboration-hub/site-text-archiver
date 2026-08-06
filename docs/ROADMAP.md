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
- Required tests are implemented and passing.
- Errors are returned clearly.
- Documentation matches the implementation.
- No placeholder, empty function, mock-only path, or unchecked claim is counted as complete.

Progress percentages represent working product capability, not documentation volume.

---

## M0 — Project Foundation

### Status

**Implemented in source. Chrome load-unpacked acceptance remains to be manually recorded using `M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.**

### Delivered

- Manifest V3 extension shell
- Background service worker
- Popup and dashboard foundations
- Shared result and identifier helpers
- Typed runtime message foundation
- Settings validation and local persistence
- Scratch browser test harness

### Product Completion

10%

---

## M1 — URL Intelligence and Safety

### Status

**Implemented and verified with pure-module tests.**

Evidence: `M1_IMPLEMENTATION_REPORT.md`.

### Delivered

- URL resolver and canonical normalizer
- Query-parameter policy
- Origin and path guard
- Include and exclude patterns
- Blocked-extension filtering
- Unsafe action-link detection
- Duplicate URL registry
- Integrated URL admission pipeline
- Machine-readable reason codes and evidence

### Acceptance Results

- Equivalent URL forms resolve to one canonical key.
- Every rejection returns an explicit reason.
- Future queueing and discovery must pass the M1 admission gate.

### Product Completion

20%

---

## M2 — Crawl Queue and State Machine

### Status

**Implemented and verified with deterministic module, mocked-storage, command-flow, and restart-recovery tests.**

Evidence: `M2_IMPLEMENTATION_REPORT.md`.

### Delivered

- Crawl lifecycle state machine
- State-version conflict detection
- Deterministic bounded priority queue
- Stable retry, depth, discovery-order, and lexical tie breaking
- Task records and state updates
- Crawl configuration validation and safety bounds
- Create, start, pause, resume, and cancel commands
- Persisted crawl run, queue, counts, events, and request cache
- Idempotent state-changing commands by request ID
- Seed-task admission through M1 safety
- Service-worker restart recovery
- Interrupted-task requeueing
- Completed-task preservation
- Popup lifecycle controls
- Dashboard counts and progress-event history

### Verification Completed

- Valid and invalid lifecycle transition tests
- Terminal-state locking tests
- Queue-order and delayed-task tests
- Duplicate and queue-limit tests
- Snapshot restoration tests
- Message-payload validation tests
- Persisted command-flow tests
- Request replay tests
- Simulated worker-restart recovery tests

### Acceptance Results

- Queue order is deterministic.
- Invalid state transitions are rejected without side effects.
- Persisted completed tasks survive runtime restart repair.

### Runtime Boundary

M2 schedules and persists work but does not fetch website pages. Network processing starts in M3.

### Product Completion

32%

---

## M3 — Page Fetching and Link Discovery

### Goal

Fetch allowed HTML pages and discover new documentation links.

### Deliverables

- Fetch timeout and cancellation handling
- Response classification
- HTML content-type validation
- Request delay policy
- Link extraction and base URL handling
- Canonical-link awareness
- Fetch failure records
- Retry classification
- M1 revalidation of discovered and redirected URLs

### Acceptance Criteria

- Only approved HTML pages are processed.
- Temporary and permanent failures are classified separately.
- Newly discovered links pass M1 normalization and scope checks.

### Product Completion

43%

---

## M4 — Semantic Content Extraction

### Goal

Extract useful documentation content while preserving technical structure.

### Deliverables

- DOM cleanup and main-content detection
- Text-density scoring
- Heading, paragraph, and list extraction
- Table conversion and code-block preservation
- Relevant link and metadata extraction
- Extraction warnings

### Acceptance Criteria

- Extracted content remains readable and structurally correct.
- Code blocks and tables remain usable.
- Repeated interface content is substantially reduced.

### Product Completion

58%

---

## M5 — Markdown and JSON Archive Generation

### Goal

Generate deterministic, source-backed archives.

### Deliverables

- Page-to-Markdown conversion
- Stable page ordering and heading normalization
- Source URL blocks and table of contents
- Combined Markdown and structured JSON export
- Crawl and failed-page reports
- Browser download integration

### Acceptance Criteria

- The same stored crawl produces the same export.
- Markdown renders correctly.
- Every page retains its source URL.

### Product Completion

68%

---

## M6 — Offline Agent Controller and Quality System

### Goal

Add deterministic planning, quality scoring, and bounded recovery decisions.

### Deliverables

- Agent controller and initial crawl planner
- Page priority and content quality scoring
- Duplicate-content and boilerplate detection
- Recovery manager
- Final archive validator
- Explainable decision event log

### Acceptance Criteria

- Every decision includes evidence and a reason code.
- Retry behavior is bounded.
- Low-quality content is flagged rather than silently accepted.

### Product Completion

78%

---

## M7 — Local Search Index

### Goal

Make archived documentation searchable without external services.

### Deliverables

- Tokenizer and text normalizer
- Stop-word policy and section splitter
- Inverted index and heading weighting
- Document-frequency statistics
- Phrase preference, snippets, and source filters

### Acceptance Criteria

- Search returns relevant sections.
- Heading matches receive appropriate weight.
- Results are deterministic and source-linked.

### Product Completion

87%

---

## M8 — Extractive Local Question Answering

### Goal

Answer questions using only archived evidence.

### Deliverables

- Question tokenization and query weighting
- Candidate retrieval and passage ranking
- Extractive answer selection
- Multiple-source support
- Confidence indicators and source attribution
- Insufficient-evidence response

### Acceptance Criteria

- Answers cite source pages.
- Unsupported questions return insufficient evidence.
- The engine does not invent missing facts.

### Product Completion

93%

---

## M9 — Dashboard, Reliability, and Functional Release

### Goal

Complete the user experience, reliability checks, and functional release preparation.

### Deliverables

- Full crawl dashboard and queue visualization
- Failed/skipped inspection and quality reports
- Search and question-answering interfaces
- Export controls
- Accessibility and performance passes
- Example archives
- Installation, usage, and release documentation

### Acceptance Criteria

- A non-developer can install and use the extension.
- A complete crawl can be inspected and exported.
- Interrupted sessions do not corrupt completed data.
- Core workflows have automated and manual evidence.

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

**M3 — Page Fetching and Link Discovery**.
