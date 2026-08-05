# Site Text Archiver — Development Roadmap

## Roadmap Objective

This roadmap converts the project vision into small, testable milestones. Each milestone must produce a usable and verifiable result before the next layer is added.

The project will be built from scratch with plain JavaScript, HTML, CSS, browser-native APIs, and locally implemented algorithms.

## Progress Rules

A milestone is complete only when:

- Its required files exist.
- Its core behavior works manually.
- Its pure logic has automated tests.
- Errors are reported clearly.
- Documentation reflects the actual implementation.
- No unfinished placeholder is counted as complete.

---

## M0 — Project Foundation

### Goal

Create a clean, installable Chrome extension skeleton and development standards.

### Deliverables

- `manifest.json` using Manifest V3
- Background service worker
- Popup shell
- Dashboard shell
- Shared constants and message types
- Basic local settings storage
- License and contribution guide
- Test harness that does not require npm

### Acceptance Criteria

- Extension loads through Chrome's Load Unpacked flow.
- Popup opens without console errors.
- Dashboard opens from the popup.
- Popup and background service worker can exchange a test message.
- Settings survive browser restart.

### Estimated Product Completion

10%

---

## M1 — URL Intelligence and Safety

### Goal

Build the complete URL normalization, scope validation, and safe-link filtering layer.

### Deliverables

- URL resolver
- Canonical URL normalizer
- Origin and path guard
- Include and exclude pattern support
- Blocked extension list
- Unsafe account-action detection
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
- Logout/delete/purchase action links
- Circular URLs

### Acceptance Criteria

- Equivalent URLs resolve to one canonical key.
- Every rejected URL has an explicit reason.
- Out-of-scope links can never enter the crawl queue.

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

### Required Tests

- Valid and invalid state transitions
- Stable priority ordering
- Duplicate task insertion
- Limit enforcement
- Pause and resume behavior
- Cancellation behavior
- Recovery after service-worker restart

### Acceptance Criteria

- Queue order is deterministic.
- Invalid state transitions are rejected.
- Restarting the service worker does not lose completed tasks.

### Estimated Product Completion

32%

---

## M3 — Page Fetching and Link Discovery

### Goal

Fetch allowed HTML pages safely and discover new documentation links.

### Deliverables

- Fetch timeout handling
- Response classification
- HTML content-type validation
- Request delay policy
- Link extraction
- Base URL handling
- Canonical-link awareness
- Fetch failure records
- Basic retry classification

### Required Tests

- HTML and non-HTML responses
- Redirect handling
- Timeout classification
- 404 and 500 responses
- 429 rate limits
- Relative links
- `<base>` tag behavior
- Duplicate link discovery

### Acceptance Criteria

- Only approved HTML pages are processed.
- Temporary and permanent failures are classified separately.
- Newly discovered links pass through normalization and scope checks.

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

### Required Tests

- Article-based documentation pages
- Sidebar-heavy layouts
- Nested headings
- Nested lists
- Complex tables
- Inline and block code
- Empty pages
- Hidden elements
- Repeated navigation

### Acceptance Criteria

- Extracted content remains readable and structurally correct.
- Code blocks and tables are not flattened into unusable text.
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

### Required Tests

- Markdown escaping
- Code fences containing backticks
- Tables
- Heading collisions
- Duplicate page titles
- Stable ordering
- Empty archive prevention

### Acceptance Criteria

- The same stored crawl produces the same export.
- Markdown renders correctly in common viewers.
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
- Boilerplate frequency detector
- Failure recovery manager
- Final archive validator
- Decision event log

### Required Tests

- Acceptable and low-quality pages
- Exact duplicate pages
- Near-duplicate pages
- Boilerplate-heavy pages
- Recoverable network failures
- Permanent failures
- Retry exhaustion
- Archive validation failures

### Acceptance Criteria

- Every agent decision includes evidence and a reason code.
- Retry behavior is bounded.
- Low-quality content is flagged rather than silently accepted.

### Estimated Product Completion

78%

---

## M7 — Local Search Index

### Goal

Make downloaded documentation searchable without external services.

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

### Required Tests

- Exact keyword queries
- Multi-word queries
- Heading matches
- Rare-term ranking
- Phrase ranking
- Repeated terms
- Empty and invalid queries

### Acceptance Criteria

- Search returns relevant sections, not only whole pages.
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
- Candidate section retrieval
- Passage ranking
- Answer passage extraction
- Multiple-source support
- Confidence indicators
- Insufficient-evidence response
- Source attribution

### Required Tests

- Direct factual questions
- Questions requiring section-title matching
- Multiple relevant passages
- Ambiguous questions
- Questions absent from the archive
- Weak evidence

### Acceptance Criteria

- Answers always cite source pages.
- Unsupported questions return insufficient evidence.
- The engine does not invent missing facts.

### Estimated Product Completion

93%

---

## M9 — Dashboard, Reliability, and Release

### Goal

Complete the user experience, harden the extension, and prepare version 1.0.

### Deliverables

- Full crawl dashboard
- Queue visualization
- Failed and skipped page inspection
- Quality report UI
- Archive search UI
- Question-answering UI
- Export controls
- Accessibility pass
- Performance profiling
- Security review
- Example archives
- Installation and usage documentation
- Version 1.0 release checklist

### Required Tests

- Full crawl lifecycle
- Browser restart during crawl
- Large documentation archive
- Cancellation during fetch and extraction
- Export after partial crawl
- Corrupted stored record handling
- UI keyboard navigation
- HTML sanitization

### Acceptance Criteria

- A non-developer can install and use the extension.
- A complete crawl can be inspected and exported.
- Crashes or interrupted sessions do not corrupt completed data.
- Core workflows have automated and manual test evidence.

### Estimated Product Completion

100%

---

## Recommended Build Order

```text
M0 Foundation
 -> M1 URL Safety
 -> M2 Queue and State
 -> M3 Fetch and Discovery
 -> M4 Extraction
 -> M5 Export
 -> M6 Agent and Quality
 -> M7 Local Search
 -> M8 Question Answering
 -> M9 Release
```

## First Implementation Target

The first useful prototype should include M0 through M5.

That prototype will already be able to:

- Load as a Chrome extension
- Crawl a limited documentation website
- Extract useful content
- Avoid unsafe and duplicate links
- Export Markdown and JSON

Offline intelligence should be added only after the basic archiver is reliable.
