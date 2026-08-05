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
- Run without npm packages, a backend, or an online AI API

## Offline Agent

The agent is deterministic and task-specific. It is not dependent on an online language model.

It uses locally implemented algorithms for:

- Crawl planning
- URL priority scoring
- Queue management
- Main-content detection
- Duplicate and near-duplicate detection
- Boilerplate frequency analysis
- Extraction-quality scoring
- Failure classification and bounded recovery
- Archive validation
- Tokenization and inverted indexing
- Section and passage ranking
- Extractive question answering

## Technology

- Chrome Extension Manifest V3
- Plain JavaScript
- HTML and CSS
- Chrome Extension APIs
- Fetch API
- DOMParser
- IndexedDB
- Web Workers or offscreen processing where required
- Browser-native Web Crypto

No npm dependency, cloud database, hosted model, external AI API, or backend server is required.

## Planned Repository Structure

```text
site-text-archiver/
├── manifest.json
├── README.md
├── LICENSE
├── docs/
├── src/
│   ├── background/
│   ├── crawler/
│   ├── extraction/
│   ├── storage/
│   ├── export/
│   ├── messaging/
│   └── shared/
├── agent/
│   ├── controller.js
│   ├── planner.js
│   ├── task-queue.js
│   ├── quality-checker.js
│   ├── recovery-manager.js
│   ├── indexer.js
│   └── question-answering.js
├── popup/
├── dashboard/
├── workers/
├── assets/
└── tests/
```

## Main Workflow

```text
User configuration
-> crawl planning
-> URL normalization and scope checks
-> priority queue
-> controlled page fetch
-> DOM parsing and content extraction
-> quality and duplicate analysis
-> local persistence
-> Markdown and JSON archive generation
-> local indexing
-> search and extractive question answering
-> final validation
```

## User Flow

1. Open a documentation page.
2. Open the extension popup.
3. Confirm the starting URL, allowed origin, and path.
4. Set page, depth, delay, and retry limits.
5. Analyze the website.
6. Start the crawl.
7. Monitor progress in the dashboard.
8. Pause, resume, or cancel when required.
9. Inspect completed, skipped, and failed pages.
10. Export Markdown, JSON, and reports.
11. Search the local archive or ask a source-backed question.

## Generated Files

```text
documentation.md
documentation.json
crawl-report.json
failed-pages.json
```

## Implementation Roadmap

- **M0:** Extension foundation
- **M1:** URL normalization and scope rules
- **M2:** Crawl queue and resumable state machine
- **M3:** Page fetching and link discovery
- **M4:** Semantic content extraction
- **M5:** Markdown and JSON export
- **M6:** Offline agent, quality, duplicates, and recovery
- **M7:** Local search index
- **M8:** Extractive question answering
- **M9:** Dashboard, reliability, and release completion

Detailed execution rules are maintained in:

```text
docs/ROADMAP.md
docs/SOLO_IMPLEMENTATION_PLAN.md
docs/MODULE_SPECIFICATIONS.md
docs/ALGORITHMS_AND_PSEUDOCODE.md
docs/API_MESSAGE_DATA_CONTRACTS.md
docs/TESTING_STRATEGY.md
docs/UI_USER_FLOW_SPECIFICATION.md
```

## Completion Rule

A feature is not complete merely because a placeholder or draft exists. Completion requires:

- Working source files
- Documented interfaces
- Required tests
- Passing expected behavior
- Error handling
- Updated progress documentation

## Current Status

The architecture and implementation documentation are nearly complete. Source-code implementation will proceed in milestone order, starting with M0 and continuing until the extension is usable end to end.

## License

This project is available under the MIT License.
