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

### Goal

Create an installable Chrome Manifest V3 extension skeleton and the shared foundation needed by later modules.

### Deliverables

- `manifest.json`
- Background service worker
- Popup shell
- Dashboard shell
- Shared constants and message types
- ID and result helpers
- Basic local settings storage
- Test harness without npm
- License and solo implementation documentation

### Acceptance Criteria

- Extension loads through Chrome's Load Unpacked flow.
- Popup opens without console errors.
- Dashboard opens from the popup.
- Popup and service worker exchange a validated message.
- Settings survive browser restart.
- Test harness runs and reports results.

### Product Completion

10%

---

## M1 — URL Intelligence and Crawl Scope

### Goal

Implement canonical URL normalization, origin/path enforcement, filtering, and duplicate URL prevention.

### Deliverables

- Relative URL resolver
- Canonical URL normalizer
- Query-parameter policy
- Origin and path guard
- Include and exclude patterns
- Blocked extension policy
- Action-link filter
- Visited and queued URL registries
- Machine-readable reason codes

### Acceptance Criteria

- Equivalent URLs resolve to one canonical key.
- Every rejected URL has an explicit reason.
- Out-of-scope URLs never enter the queue.
- URL and scope tests pass.

### Product Completion

20%

---

## M2 — Crawl Queue and Resumable State

### Goal

Create deterministic scheduling and persisted crawl lifecycle management.

### Deliverables

- Crawl state machine
- Stable priority queue
- Crawl configuration validation
- Page, depth, delay, and retry limits
- Pause, resume, and cancel controls
- Persisted task state
- Crawl statistics
- Progress events
- Restart recovery

### Acceptance Criteria

- Queue order is deterministic.
- Invalid transitions are rejected.
- Duplicate tasks are rejected.
- Restarting the service worker does not lose completed tasks.
- Pause, resume, cancel, and recovery tests pass.

### Product Completion

32%

---

## M3 — Page Fetching and Link Discovery

### Goal

Fetch approved HTML pages under bounded controls and discover additional documentation links.

### Deliverables

- Request-delay policy
- Fetch timeout and abort handling
- HTTP response classification
- HTML content-type validation
- Redirect revalidation
- Link extraction
- `<base>` URL support
- Canonical-link awareness
- Failure records
- Retry classification

### Acceptance Criteria

- Only approved HTML pages are processed.
- Temporary and permanent failures are distinguished.
- Redirects are rechecked against crawl scope.
- Discovered links pass normalization and scope checks.
- Circular links do not create an unbounded queue.

### Product Completion

43%

---

## M4 — Semantic Content Extraction

### Goal

Extract readable technical documentation while preserving useful structure.

### Deliverables

- Safe DOM parsing copy
- DOM cleanup
- Main-content candidate scoring
- Heading hierarchy extraction
- Paragraph extraction
- Ordered and unordered lists
- Table conversion
- Code-block preservation
- Relevant-link preservation
- Page metadata
- Extraction warnings

### Acceptance Criteria

- Article and sidebar-heavy fixtures select the useful content.
- Headings, lists, tables, and code remain readable.
- Duplicate block emission is prevented.
- Navigation and repeated interface text are substantially reduced.
- Extraction tests pass.

### Product Completion

58%

---

## M5 — Markdown, JSON, and Reports

### Goal

Generate deterministic source-backed archives and crawl reports.

### Deliverables

- Page-to-Markdown renderer
- Stable page ordering
- Heading-level normalization
- Source URL blocks
- Table of contents
- Combined Markdown export
- Structured JSON export
- Crawl report
- Failed-page report
- Browser download integration
- Archive validation

### Acceptance Criteria

- The same stored snapshot produces byte-stable output.
- Code fences and tables render correctly.
- Every exported page includes its source.
- Empty or invalid archives are rejected.
- Golden export tests pass.

### Product Completion

68%

---

## M6 — Offline Agent and Quality System

### Goal

Add deterministic planning, page-quality analysis, duplicate analysis, and bounded recovery.

### Deliverables

- Agent controller
- Initial planner
- Crawl priority scoring
- Content-quality scoring
- Exact duplicate detector
- Near-duplicate detector
- Boilerplate frequency model
- Recovery manager
- Decision-event log
- Final archive checks

### Acceptance Criteria

- Every agent decision has a reason and evidence.
- Retry behavior is bounded.
- Weak pages are flagged or retried through documented rules.
- Duplicate relations are reported rather than silently discarded.
- Controller and quality tests pass.

### Product Completion

78%

---

## M7 — Local Search Index

### Goal

Make downloaded documentation searchable without external services.

### Deliverables

- Technical tokenizer
- Text normalizer
- Stop-word policy
- Section splitter
- Inverted index
- Heading/body weighting
- Document-frequency statistics
- Phrase and proximity preference
- Search snippets
- Source filters
- Incremental re-indexing

### Acceptance Criteria

- Search returns relevant sections.
- Heading and rare-term matches receive appropriate weight.
- Results have stable ordering and source references.
- Re-indexing does not leave stale postings.
- Search tests pass.

### Product Completion

87%

---

## M8 — Extractive Local Question Answering

### Goal

Answer questions only through evidence contained in the local archive.

### Deliverables

- Question processing
- Candidate-section retrieval
- Passage-window creation
- Passage ranking
- Multiple-source support
- Confidence indicators
- Insufficient-evidence response
- Source attribution

### Acceptance Criteria

- Answers return extracted supporting passages.
- Every answer includes source information.
- Unsupported questions return insufficient evidence.
- Candidate and passage limits are enforced.
- Repeated runs produce stable ordering.

### Product Completion

93%

---

## M9 — Complete Dashboard and Release Candidate

### Goal

Finish the user experience, reliability work, examples, and release-ready functional build.

### Deliverables

- Full crawl dashboard
- Queue and current-task views
- Completed, skipped, and failed-page views
- Quality report UI
- Search UI
- Question-answering UI
- Export controls
- Accessibility pass
- Performance profiling
- Example archives
- Installation and usage guide
- Functional release checklist

Dedicated security and privacy hardening remain deferred in `docs/DEFERRED_SECURITY_PRIVACY_WORK.md` and are not part of the present functional testing gate.

### Acceptance Criteria

- A non-developer can install and use the extension.
- A complete crawl can be monitored, resumed, inspected, searched, and exported.
- Interrupted sessions do not falsely complete or corrupt pages.
- Core workflows have automated and manual test evidence.

### Product Completion

100% of the current functional scope

---

## 3. Build Order

```text
M0 Foundation
-> M1 URL Intelligence
-> M2 Queue and State
-> M3 Fetch and Discovery
-> M4 Extraction
-> M5 Export
-> M6 Agent and Quality
-> M7 Search
-> M8 Question Answering
-> M9 Dashboard and Functional Release
```

## 4. First Usable Prototype

M0 through M5 form the first useful prototype. It must:

- Load as a Chrome extension
- Crawl a bounded documentation fixture
- Normalize and filter links
- Avoid duplicate crawling
- Extract technical content
- Persist results
- Export Markdown, JSON, and reports

Offline agent control, local search, and question answering are added only after the basic archiver pipeline is reliable.

## 5. Execution Checkpoint Rule

After each milestone, ChatGPT must:

1. Inspect the actual repository state.
2. Implement missing files.
3. Run or construct the required tests.
4. Fix detected failures.
5. Update milestone status honestly.
6. Continue to the next milestone only after the current milestone's acceptance criteria are met.
