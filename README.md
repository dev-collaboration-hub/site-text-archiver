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
- M4 semantic content extraction: implemented and verified
- M5 Markdown and JSON archive generation: **implemented and verified**
- Extension version: **0.6.0**
- GitHub Actions M4/M5 verification: **passing for implementation verification commits**
- Chrome load-unpacked/manual acceptance: not yet recorded
- Current functional product completion: **approximately 68%**
- Next implementation target: **M6 Offline Agent Controller and Quality System**

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

- Scratch-built inert HTML AST parser
- Hidden/executable markup cleanup
- Evidence-based main-content detection
- Headings, paragraphs, links, lists, tables, code blocks, blockquotes, and callouts
- Page metadata and canonical URL extraction
- Browser-native SHA-256 content/structure hashes
- IndexedDB PageRecord persistence
- Restart-safe `FETCHED -> EXTRACTING -> EXTRACTED` flow

### M5 — Markdown and JSON Archive Generation

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

M5 provides:

- Stable PageRecord ordering
- Final semantic-block-to-Markdown rendering
- Combined-document heading normalization
- Unique duplicate-title TOC anchors
- Source URL blocks for every page
- Safe code fences for embedded backticks
- Markdown-table escaping
- Combined `documentation.md`
- Byte-stable structured `documentation.json`
- `crawl-report.json`
- Conditional `failed-pages.json`
- Terminal-snapshot export safety
- `EMPTY_ARCHIVE` protection
- Browser-native `chrome.downloads` integration
- Download filename/path sanitization
- Dashboard archive download control

Cross-page boilerplate scoring, duplicate-content analysis, quality scoring, and recovery decisions remain intentionally in M6.

## Current Runtime Boundary

The extension can now crawl approved documentation pages, convert fetched HTML into semantic PageRecords, and export a terminal crawl as deterministic Markdown/JSON/report files.

M6 will add the offline agent's cross-page quality, duplicate/boilerplate analysis, explainable decisions, and bounded recovery behavior.

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
8. Open the dashboard after a terminal crawl.
9. Click **Download archive files** to generate and download Markdown, JSON, crawl report, and any applicable failed-page report.

## Documentation

Start with `docs/DOCUMENTATION_INDEX.md`.

Implementation evidence:

- `docs/M1_IMPLEMENTATION_REPORT.md`
- `docs/M2_IMPLEMENTATION_REPORT.md`
- `docs/M3_IMPLEMENTATION_REPORT.md`
- `docs/M4_IMPLEMENTATION_REPORT.md`
- `docs/M5_IMPLEMENTATION_REPORT.md`
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md`

## License

MIT License.
