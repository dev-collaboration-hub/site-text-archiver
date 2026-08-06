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
- M1 URL intelligence and safety: implemented and pure-module verified
- M2 crawl queue and state machine: **implemented and verified**
- Extension version: **0.3.0**
- Chrome load-unpacked/manual acceptance: not yet recorded
- Current functional product completion: **approximately 32%**
- Next implementation target: **M3 Page Fetching and Link Discovery**

Documentation completion does not mean the working product is complete. Product progress is measured from implemented and verified milestone capability.

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

## Implemented Foundation

### M0 — Extension Foundation

- Manifest V3 extension shell
- Background service worker
- Typed runtime messaging
- Local settings persistence
- Popup and dashboard foundations
- Shared results and identifier helpers
- Scratch browser test harness

### M1 — URL Intelligence and Safety

- Relative and absolute HTTP/HTTPS URL resolution
- Canonical URL normalization
- Tracking-query removal and deterministic query sorting
- Stable canonical keys
- Exact origin and path-segment-aware scope checks
- Include and exclude patterns
- Downloadable-file blocking
- Unsafe action-link detection
- Page and depth limit decisions
- Duplicate URL detection
- Machine-readable reason codes and evidence

### M2 — Crawl Queue and State Machine

```text
src/crawler/crawl-config.js
src/crawler/crawl-run.js
src/crawler/crawl-state.js
src/crawler/state-transition.js
src/crawler/task-record.js
src/crawler/priority-task-queue.js
src/crawler/progress-events.js
src/messaging/request-cache.js
src/messaging/event-publisher.js
src/storage/crawl-store.js
src/background/runtime-controller.js
```

M2 provides:

- Deterministic bounded priority queue
- Stable queue ordering and duplicate rejection
- Crawl lifecycle transition validation
- Start, pause, resume, and cancel commands
- State-version conflict detection
- Persisted queue, run statistics, and progress events
- Idempotent request replay protection
- Service-worker restart recovery
- Interrupted-task requeueing
- Preservation of completed tasks during recovery
- Popup crawl controls
- Dashboard counts and recent event history

## Current Runtime Boundary

M2 can create and persist a safe seed queue, enter `RUNNING`, pause, resume, cancel, and recover after service-worker suspension.

**It does not fetch website pages yet.** M3 adds the network processing loop, HTML response classification, and connected-link discovery.

## Technology

- Chrome Extension Manifest V3
- Plain JavaScript
- HTML and CSS
- Chrome Extension APIs
- URL and Fetch APIs
- DOMParser
- IndexedDB and extension-local storage
- Web Workers
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
5. Click **Save setup**.
6. Click **Create** to validate the start URL and persist the seed queue.
7. Use **Start**, **Pause**, **Resume**, or **Cancel** to control the M2 lifecycle.
8. Open the dashboard to inspect queue counts and progress events.

At the current milestone, starting changes and persists the crawl lifecycle; actual page downloading begins in M3.

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
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md`

The documentation foundation is complete for the currently approved scope and must remain synchronized as implementation progresses.

## License

MIT License.
