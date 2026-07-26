# Site Text Archiver 🌐🤖

A lightweight Chrome extension with an offline AI agent that crawls documentation websites, organizes their content, verifies extraction quality, and exports everything into structured Markdown.

## Project Goal

Site Text Archiver collects an entire documentation website without requiring users to open every page manually.

Its offline AI agent plans the crawl, performs extraction tasks, detects problems, retries recoverable failures, organizes pages, and checks the final archive before export.

## Core Features

* Crawl complete documentation websites
* Discover unopened pages automatically
* Restrict crawling to an allowed domain and path
* Extract headings, paragraphs, lists, tables and code blocks
* Remove navigation menus, advertisements and repeated interface elements
* Avoid duplicate URLs and circular links
* Preserve page titles and source URLs
* Pause, resume and cancel crawling
* Export everything into one Markdown file
* Work without a backend or cloud service
* Use plain JavaScript with no npm dependencies

## Offline AI Agent

The extension includes a lightweight local AI agent designed specifically for documentation tasks.

The agent does not depend on an online LLM. It uses locally implemented planning, scoring, retrieval and decision-making algorithms.

### Agent Tasks

The agent can:

* Analyze the starting website
* Create a crawl plan
* Discover documentation sections
* Prioritize important pages
* Manage the crawl queue
* Detect duplicate and near-duplicate content
* Identify main page content
* Remove repeated navigation text
* Detect incomplete extractions
* Retry temporarily failed pages
* Skip unsafe or irrelevant links
* Organize pages into sections
* Generate a table of contents
* Check missing or broken page references
* Validate Markdown output
* Produce a crawl summary
* Answer questions from downloaded documentation
* Show the source page used for each answer

### Agent Safety

The agent will not:

* Bypass authentication
* Solve CAPTCHAs
* Bypass paywalls
* Ignore website access restrictions
* Submit forms
* Click account-action links
* Upload extracted content
* Send private data to external servers

## Local Question Answering

After crawling, users can ask questions such as:

```text
What changed in Edition 2?
```

```text
What files are required for a task?
```

```text
What are the diversity requirements?
```

The agent searches the local documentation index and returns an extractive answer with source references.

Question answering uses:

* Tokenization
* Keyword matching
* Document scoring
* Section ranking
* Local inverted index
* Relevant passage extraction
* Source attribution

## How It Works

1. Enter a starting documentation URL.
2. Select the allowed website path.
3. The AI agent analyzes the website structure.
4. The crawler discovers internal documentation links.
5. Pages are fetched and processed locally.
6. The agent checks extraction quality.
7. Content is converted into Markdown.
8. A local search index is created.
9. The final archive is validated.
10. `documentation.md` is downloaded.

## Example

Starting URL:

```text
https://example.com/docs/
```

Generated files:

```text
documentation.md
crawl-report.json
```

Example Markdown output:

```markdown
# Documentation Archive

Source: https://example.com/docs/

## Table of Contents

- Getting Started
- Installation
- Task Requirements
- Submission Process

## Getting Started

Source: https://example.com/docs/getting-started

Page content...
```

## Project Structure

```text
site-text-archiver/
├── manifest.json
├── README.md
├── LICENSE
├── src/
│   ├── background.js
│   ├── crawler.js
│   ├── extractor.js
│   ├── markdown.js
│   ├── storage.js
│   └── exporter.js
├── agent/
│   ├── agent.js
│   ├── planner.js
│   ├── task-queue.js
│   ├── content-analyzer.js
│   ├── quality-checker.js
│   ├── recovery.js
│   ├── indexer.js
│   └── question-answering.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
└── assets/
    └── icons/
```

## Architecture

### AI Agent

Plans tasks, coordinates modules, checks results and decides the next safe action.

### Crawler

Discovers internal links and processes the crawl queue.

### Content Extractor

Identifies useful page content and removes unrelated interface elements.

### Quality Checker

Detects empty pages, incomplete extraction, repeated content and malformed output.

### Recovery Manager

Retries recoverable failures with strict attempt limits.

### Local Indexer

Creates an offline searchable index from collected documentation.

### Question Answering Engine

Finds relevant passages and produces source-backed extractive answers.

### Markdown Exporter

Combines pages in deterministic order and generates the final archive.

## Technology

* Chrome Extension Manifest V3
* Plain JavaScript
* HTML and CSS
* Chrome Extension APIs
* Fetch API
* DOMParser
* IndexedDB
* Web Workers

No npm package, online AI API, server or cloud database is required.

## Installation

1. Clone or download this repository.
2. Open Chrome.
3. Visit:

```text
chrome://extensions/
```

4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project directory.
7. Pin Site Text Archiver to the toolbar.

## Usage

1. Open the documentation website.
2. Click the extension icon.
3. Confirm the starting URL and allowed path.
4. Click **Analyze Website**.
5. Review the agent’s crawl plan.
6. Click **Start Crawl**.
7. Monitor tasks from the dashboard.
8. Review failed or skipped pages.
9. Ask questions from the local archive if needed.
10. Click **Export Markdown**.

## Crawl Rules

The crawler will:

* Follow only HTTP and HTTPS pages
* Stay inside the selected domain
* Stay inside the configured path
* Remove URL fragments
* Normalize duplicate URLs
* Skip images, videos and download files
* Skip logout and account-action links
* Apply page, depth and retry limits
* Respect user cancellation
* Record failed and skipped URLs

## Privacy

All extraction, indexing and question answering happens locally inside Chrome.

Site Text Archiver does not:

* Upload documentation
* Send queries to an AI API
* Track browsing activity
* Require an account
* Use analytics
* Store content permanently without user action

## Limitations

Some pages may not be available because of:

* Authentication requirements
* Bot protection
* JavaScript-only navigation
* Strict Content Security Policies
* Missing internal links or sitemaps
* Rate limits
* Website access restrictions

The extension cannot guarantee access to pages that the current Chrome session is not authorized to read.

## Development Roadmap

### Phase 1 — Extension Foundation

* [ ] Manifest V3 configuration
* [ ] Popup interface
* [ ] Domain and path permissions
* [ ] Local settings storage

### Phase 2 — Website Crawler

* [ ] Link discovery
* [ ] Crawl queue
* [ ] URL normalization
* [ ] Duplicate prevention
* [ ] Crawl limits

### Phase 3 — Content Extraction

* [ ] Main-content detection
* [ ] Navigation removal
* [ ] Table extraction
* [ ] Code block preservation
* [ ] Markdown conversion

### Phase 4 — Offline AI Agent

* [ ] Agent controller
* [ ] Task planner
* [ ] Priority queue
* [ ] Content classification
* [ ] Quality checking
* [ ] Failure recovery
* [ ] Final archive validation

### Phase 5 — Local Intelligence

* [ ] Documentation index
* [ ] Section ranking
* [ ] Local question answering
* [ ] Source attribution
* [ ] Missing-topic detection

### Phase 6 — Export and Reporting

* [ ] Combined Markdown export
* [ ] Crawl report
* [ ] Failed-page report
* [ ] Table of contents
* [ ] JSON export

## Contributing

Contributions, bug reports and feature suggestions are welcome.

Create an issue before making a major architectural change.

## License

This project is available under the MIT License.
