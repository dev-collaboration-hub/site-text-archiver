# Site Text Archiver 🌐🤖

A lightweight Chrome extension with a scratch-built offline agent that crawls documentation websites, extracts useful content, organizes it, builds a local search index, and exports structured Markdown and JSON.

## Development Mode

This project is being completed through a **single-owner implementation workflow**.

- Dilip Singh defines product direction and priorities.
- ChatGPT performs architecture, documentation, implementation, tests, debugging, and repository updates.
- Work is completed milestone by milestone on the repository's `main` branch.
- A milestone is counted as complete only when its source, tests, and documentation are present and working.

## Current Status

- Documentation foundation: **100% for the current approved scope**
- M0 extension foundation: implemented
- M1 URL intelligence and safety: implemented and verified
- M2 crawl queue and state machine: implemented and verified
- M3 page fetching and link discovery: **implemented and verified with local core and mocked-flow tests**
- Extension version: **0.4.0**
- Chrome load-unpacked/manual acceptance: not yet recorded
- Current functional product completion: **approximately 43%**
- Next implementation target: **M4 Semantic Content Extraction**

Product progress is measured from implemented milestone capability, not documentation volume.

## Project Goal

Site Text Archiver collects connected documentation pages without requiring the user to open and copy every page manually.

The local agent plans the crawl, prioritizes pages, manages the queue, evaluates extraction quality, retries recoverable failures, organizes the archive, builds a local index, and checks the final output before export.

The agent is deterministic and fully offline. It is not a hosted LLM or external AI API.

## Core Features

- Crawl documentation websites inside an approved origin and path
- Discover connected pages automatically
- Normalize URLs and prevent duplicate or circular crawling
- Extract headings, paragraphs, lists, tables, links, and code blocks
- Reduce repeated navigation and interface text
- Preserve page titles and source URLs
- Pause, resume, and cancel crawling
- Persist crawl state locally
- Export combined Markdown, JSON, and crawl reports
- Search archived documentation offline
- Return source-backed extractive answers
- Operate without npm packages, a backend, or a hosted AI API

## Implemented Milestones

### M0 — Extension Foundation

- Manifest V3 extension shell
- Background service worker
- Typed runtime messaging
- Local settings persistence
- Popup and dashboard foundations
- Shared results and identifier helpers
- Scratch browser test harness

### M1 — URL Intelligence and Safety

- Relative and absolute URL resolution
- Canonical URL normalization
- Tracking-query removal and deterministic query sorting
- Exact origin and path checks
- Include/exclude patterns
- Blocked-extension filtering
- Unsafe action-link detection
- Duplicate canonical URL detection
- Machine-readable reason codes

### M2 — Crawl Queue and State Machine

- Deterministic bounded priority queue
- Crawl lifecycle transitions
- Start, pause, resume, and cancel commands
- Persisted queue, counts, events, and request cache
- Idempotent state-changing commands
- Service-worker restart recovery
- Popup lifecycle controls
- Dashboard runtime state

### M3 — Page Fetching and Link Discovery

```text
src/crawler/response-classifier.js
src/crawler/fetcher.js
src/crawler/link-discovery.js
src/crawler/fetch-record.js
src/crawler/network-crawler.js
src/storage/page-html-store.js
src/background/alarm-adapter.js
```

M3 provides:

- GET-only bounded HTML fetching
- Timeout and cooperative Pause/Cancel cancellation
- Temporary/permanent HTTP failure classification
- Retry-After-aware retry scheduling
- HTML content-type and byte-size validation
- Redirect final-URL M1 revalidation
- Scratch-built HTML start-tag scanner
- `<base href>` support
- Canonical-link awareness
- Deterministic connected-link discovery
- M1 validation before discovered links enter the M2 queue
- Raw fetched HTML persisted in IndexedDB for M4
- Fetch metadata persisted with the crawl state
- Manifest V3 alarm-driven one-task-at-a-time processing
- Per-origin optional host permission requested when the user creates a crawl

## Current Runtime Boundary

M3 can now perform a real bounded documentation crawl through the fetch-and-discovery stage.

Successful pages end in `FETCHED`, and their source HTML is stored locally. **Semantic extraction is not implemented yet.** M4 will transform those fetched pages into structured headings, paragraphs, lists, tables, code blocks, links, and metadata.

## Technology

- Chrome Extension Manifest V3
- Plain JavaScript
- HTML and CSS
- Chrome Extension APIs
- URL and Fetch APIs
- IndexedDB and extension-local storage
- Browser-native Web Crypto

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
3. Review the detected start URL, origin, and allowed path.
4. Set page, depth, delay, retry, include, and exclude rules.
5. Click **Create** and approve access to that configured origin.
6. Click **Start** to begin fetching approved HTML pages.
7. Use **Pause**, **Resume**, or **Cancel** when needed.
8. Open the dashboard to inspect queued, fetched, skipped, failed, and progress-event state.

## Planned End-to-End Flow

```text
Open documentation page
-> configure crawl scope
-> create persisted queue
-> fetch bounded pages
-> discover approved links
-> extract semantic content
-> validate quality
-> export Markdown and JSON
-> build local search index
-> ask source-backed questions
```

## Documentation

Start with `docs/DOCUMENTATION_INDEX.md`.

Key implementation evidence:

- `docs/M1_IMPLEMENTATION_REPORT.md`
- `docs/M2_IMPLEMENTATION_REPORT.md`
- `docs/M3_IMPLEMENTATION_REPORT.md`
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md`

## License

MIT License.
