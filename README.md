# Site Text Archiver 🌐🤖

A lightweight Chrome extension with a scratch-built offline agent that crawls documentation websites, extracts useful content, organizes it, builds a local search index, and exports structured Markdown and JSON.

## Development Mode

This project is being completed through a **single-owner implementation workflow**.

- Dilip Singh defines the product direction and priorities.
- ChatGPT performs the architecture, documentation, implementation, tests, debugging, and repository updates.
- No contributor coordination, contribution guide, task assignment system, or external implementation workflow is required for the current build.
- Work is completed milestone by milestone on the repository's `main` branch.
- A milestone is counted as complete only when its code, tests, and documentation are present and working.

The current goal is to complete the entire project directly rather than prepare tasks for other contributors.

## Current Status

- Documentation foundation: **complete for the current approved scope (100%)**
- M0 extension foundation: implemented
- Pure-module M0 smoke tests: passing locally
- M0 Chrome browser acceptance: not yet recorded
- Current functional product stage: early foundation, approximately 10%
- Next implementation target: M1 URL intelligence and safety

Documentation completion does not mean the working product is complete. Product progress is measured only from implemented and verified milestone capability.

## Project Goal

Site Text Archiver collects connected documentation pages without requiring the user to open and copy every page manually.

The local agent plans the crawl, prioritizes pages, manages the queue, evaluates extraction quality, retries recoverable failures, organizes the archive, builds a local index, and checks the final output before export.

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

## Current M0 Foundation

The repository currently includes:

```text
manifest.json
LICENSE
src/background/service-worker.js
src/messaging/message-types.js
src/messaging/message-validator.js
src/messaging/runtime-client.js
src/shared/constants.js
src/shared/result.js
src/shared/id.js
src/storage/settings-store.js
popup/popup.html
popup/popup.css
popup/popup.js
dashboard/dashboard.html
dashboard/dashboard.css
dashboard/dashboard.js
tests/index.html
tests/test-runner.js
tests/assertions.js
tests/unit/index.test.js
```

M0 provides:

- Manifest V3 extension configuration
- Background service-worker runtime
- Typed runtime message foundation
- Shared result and identifier helpers
- Local settings validation and persistence
- Popup configuration interface
- Dashboard foundation
- Scratch browser test harness

Crawling, extraction, export, indexing, and question answering are implemented in later milestones.

## Technology

- Chrome Extension Manifest V3
- Plain JavaScript
- HTML and CSS
- Chrome Extension APIs
- Fetch API
- DOMParser
- IndexedDB
- Web Workers
- Browser-native Web Crypto

No npm package, online AI API, server, or cloud database is required.

## Installation

1. Clone or download this repository.
2. Open Chrome.
3. Visit `chrome://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project directory.
7. Pin Site Text Archiver to the toolbar.

## M0 Usage

1. Open any HTTP or HTTPS documentation page.
2. Click the extension icon.
3. Review or edit the detected start URL, origin, and path.
4. Set page, depth, delay, and retry limits.
5. Click **Save setup**.
6. Open the dashboard to confirm runtime and saved configuration.

## Planned End-to-End Flow

```text
Open documentation page
-> configure crawl scope
-> analyze website
-> crawl bounded pages
-> extract semantic content
-> validate quality
-> export Markdown and JSON
-> build local search index
-> ask source-backed questions
```

## Documentation

Start with `docs/DOCUMENTATION_INDEX.md`, which defines the reading order and source-of-truth rules.

The documentation set includes:

- Project specification
- Architecture
- Roadmap
- Module specifications
- Algorithms and pseudocode
- API, message, and data contracts
- Testing strategy
- Requirements traceability matrix
- UI and user-flow specification
- M0 browser acceptance checklist
- Scratch development standard
- Solo implementation plan
- Deferred security and privacy work

The documentation foundation is complete for the currently approved scope, but it must remain synchronized as implementation progresses.

## License

MIT License.
