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
- M1 URL intelligence and safety: **implemented and pure-module verified**
- Extension version: **0.2.0**
- M0 Chrome browser acceptance: not yet recorded
- Current functional product completion: **approximately 20%**
- Next implementation target: **M2 Crawl Queue and State Machine**

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

## Implemented Foundation

The repository currently includes the M0 extension foundation and M1 URL safety engine.

### M0

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
```

### M1

```text
src/crawler/query-policy.js
src/crawler/url-resolver.js
src/crawler/url-normalizer.js
src/crawler/blocked-extensions.js
src/crawler/link-safety.js
src/crawler/scope-guard.js
src/crawler/duplicate-url-registry.js
src/crawler/url-intelligence.js
tests/unit/index.test.js
tests/unit/m1-edge.test.js
```

M1 provides:

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

The popup now saves include and exclude URL patterns locally. Crawling, fetching, extraction, export, indexing, and question answering are implemented in later milestones.

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

## Current Usage

1. Open any HTTP or HTTPS documentation page.
2. Click the extension icon.
3. Review or edit the detected start URL, origin, and path.
4. Set page, depth, delay, retry, include, and exclude rules.
5. Click **Save setup**.
6. Open the dashboard to confirm runtime and saved configuration.

The current release saves and validates setup and contains the complete M1 URL-decision engine. It does not yet start a real crawl; crawl scheduling begins in M2.

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
- M1 implementation report
- Scratch development standard
- Solo implementation plan
- Deferred security and privacy work

The documentation foundation is complete for the currently approved scope, but it must remain synchronized as implementation progresses.

## License

MIT License.
