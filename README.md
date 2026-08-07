# Site Text Archiver 🌐🤖

A lightweight Chrome extension with a scratch-built offline agent that crawls documentation websites, extracts useful content, organizes it, builds a local search index, and exports structured Markdown and JSON.

## Development Mode

This project uses a **single-owner implementation workflow**.

- Dilip Singh defines product direction and priorities.
- ChatGPT performs architecture, documentation, implementation, tests, debugging, and repository updates.
- Work proceeds milestone by milestone directly on `main`.
- A milestone counts as complete only when source, tests, and documentation are present and working.

## Current Status

- Documentation foundation: **100% for the current approved scope**
- M0 extension foundation: implemented
- M1 URL intelligence and safety: implemented and verified
- M2 crawl queue and state machine: implemented and verified
- M3 page fetching and link discovery: implemented and verified
- M4 semantic content extraction: **implemented and verified**
- Extension version: **0.5.0**
- GitHub Actions M4 verification: **passing**
- Chrome load-unpacked/manual acceptance: not yet recorded
- Current functional product completion: **approximately 58%**
- Next implementation target: **M5 Markdown and JSON Archive Generation**

Product progress is measured from implemented milestone capability, not documentation volume.

## Project Goal

Site Text Archiver collects connected documentation pages without requiring the user to open and copy every page manually.

The local agent plans the crawl, prioritizes pages, manages the queue, fetches approved HTML, extracts semantic content, later validates quality, organizes the archive, builds a local index, and checks output before export.

The agent is deterministic and fully offline. It is not a hosted LLM or external AI API.

## Implemented Milestones

### M0 — Extension Foundation

- Manifest V3 extension shell
- Background service worker
- Typed runtime messaging
- Local settings persistence
- Popup and dashboard foundations
- Scratch browser test harness

### M1 — URL Intelligence and Safety

- Relative/absolute URL resolution
- Canonical normalization
- Origin/path/include/exclude safety
- Blocked-extension and unsafe-action filtering
- Duplicate canonical URL detection
- Machine-readable decisions

### M2 — Crawl Queue and State Machine

- Deterministic bounded priority queue
- Start, pause, resume, cancel lifecycle
- Persisted queue, counts, events, and request cache
- Idempotent commands
- Service-worker restart recovery

### M3 — Page Fetching and Link Discovery

- Bounded GET-only HTML fetching
- Timeout and cooperative cancellation
- HTTP/retry classification
- Redirect revalidation through M1
- Scratch-built link scanner with `<base>` and canonical awareness
- IndexedDB fetched-HTML storage
- Manifest V3 alarm-driven processing

### M4 — Semantic Content Extraction

```text
src/extraction/dom-utils.js
src/extraction/html-parser.js
src/extraction/dom-cleaner.js
src/extraction/main-content-detector.js
src/extraction/content-extractor.js
src/extraction/page-record.js
src/extraction/extraction-pipeline.js
src/crawler/extraction-runner.js
src/storage/page-record-store.js
```

M4 provides:

- Scratch-built inert HTML AST parser
- Script/style/template/iframe/form-control and hidden-node removal
- Evidence-backed main-content scoring with body fallback
- Heading hierarchy and heading-path preservation
- Paragraphs with inline code and links
- Ordered/unordered nested lists
- Tables with simple `rowspan`/`colspan` normalization and warnings
- Code blocks with whitespace and language-hint preservation
- Blockquotes, callouts, horizontal rules, and useful image alt text
- Title, description, author, language, and canonical metadata
- Deterministic plain text and preliminary Markdown derivation
- SHA-256 content and structure hashes using browser-native Web Crypto
- PageRecords persisted separately in IndexedDB
- `FETCHED -> EXTRACTING -> EXTRACTED` persisted task flow
- Raw fetched HTML cleanup after successful PageRecord storage
- Extraction restart recovery after service-worker suspension
- Dashboard extracted-page summaries and extraction events

Cross-page boilerplate scoring, duplicate-content analysis, and quality scoring remain intentionally in M6.

## Current Runtime Boundary

The extension can now crawl approved documentation pages **and convert fetched HTML into structured semantic PageRecords**.

M5 will turn those PageRecords into deterministic combined Markdown, structured JSON, crawl reports, failed-page reports, and browser downloads.

## Technology

- Chrome Extension Manifest V3
- Plain JavaScript
- HTML and CSS
- Chrome Extension APIs
- URL and Fetch APIs
- IndexedDB and extension-local storage
- Browser-native Web Crypto
- GitHub Actions for dependency-free verification

No npm package, external JavaScript library, hosted AI model, online LLM API, backend server, or cloud database is required.

## Installation

1. Clone or download this repository.
2. Open Chrome.
3. Visit `chrome://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project directory.
7. Pin Site Text Archiver to the toolbar.

## Current Usage

1. Open an HTTP or HTTPS documentation page.
2. Open the extension popup.
3. Review the start URL, origin, path, and crawl limits.
4. Click **Create** and approve that configured origin.
5. Click **Start**.
6. The extension fetches approved pages, discovers links, and automatically extracts semantic content.
7. Use **Pause**, **Resume**, or **Cancel** when needed.
8. Open the dashboard to inspect queue, fetch, extraction, failure, and event state.

## Documentation

Start with `docs/DOCUMENTATION_INDEX.md`.

Implementation evidence:

- `docs/M1_IMPLEMENTATION_REPORT.md`
- `docs/M2_IMPLEMENTATION_REPORT.md`
- `docs/M3_IMPLEMENTATION_REPORT.md`
- `docs/M4_IMPLEMENTATION_REPORT.md`
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md`

## License

MIT License.
