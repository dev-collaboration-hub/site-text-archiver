# Site Text Archiver — Project Specification

## 1. Purpose

Site Text Archiver is a local-first Chrome extension that collects documentation pages from an allowed website scope, extracts useful text, organizes the result, validates archive quality, and exports the documentation as structured Markdown and JSON.

The project is built from scratch using browser-native capabilities. It does not depend on npm packages, cloud services, hosted language models, external AI APIs, or a backend server.

## 2. Primary Problem

Documentation websites often contain many connected pages. Manually opening, copying, cleaning, ordering, and combining those pages is slow and error-prone.

A useful archiver must solve several problems together:

1. Discover documentation pages safely.
2. Stay inside a user-approved domain and path.
3. Avoid duplicate and circular links.
4. Extract meaningful content instead of menus and repeated interface text.
5. Preserve headings, lists, tables, code blocks, links, and source information.
6. Detect incomplete or low-quality extraction.
7. Retry only recoverable failures.
8. Export deterministic and searchable archives.
9. Allow local question answering with source attribution.

## 3. Product Goals

The first stable release must:

- Run as a Chrome Manifest V3 extension.
- Crawl public documentation pages accessible to the current browser session.
- Enforce domain, path, depth, page, delay, and retry limits.
- Extract clean semantic page content.
- Store crawl state locally.
- Support pause, resume, and cancellation.
- Produce Markdown and JSON exports.
- Generate a crawl report with failures and skipped pages.
- Create a local searchable index.
- Return extractive answers with source references.
- Operate without transmitting archived content externally.

## 4. Non-Goals

The project will not:

- Bypass authentication, CAPTCHAs, paywalls, access restrictions, or robots enforced by the target site.
- Submit forms or perform account actions.
- Click logout, delete, purchase, unsubscribe, or other unsafe links.
- Execute arbitrary scripts from crawled pages.
- Behave as a general-purpose browser automation framework.
- Generate unsupported answers that are not grounded in archived content.
- Depend on a cloud AI model.

## 5. Target Users

### 5.1 Developers

Developers who need an offline copy of API documentation, framework guides, project instructions, or technical references.

### 5.2 Researchers and Students

Users who need structured text archives for reading, searching, comparison, or note preparation.

### 5.3 AI and Tool Builders

Builders who need clean documentation corpora for local retrieval, evaluation, parsing, or agent experiments.

## 6. Core User Flow

1. The user opens a documentation page.
2. The extension reads the current URL.
3. The user confirms the allowed origin and path prefix.
4. The user configures crawl limits.
5. The planner analyzes the starting page and creates a crawl plan.
6. The user starts the crawl.
7. The crawler discovers, normalizes, validates, and queues links.
8. The extractor converts each page into a normalized page record.
9. The quality checker scores extraction quality.
10. Recoverable failures are retried within fixed limits.
11. Processed pages are stored locally.
12. The archive builder orders pages and generates a table of contents.
13. The validator checks the final output.
14. The user exports Markdown, JSON, and crawl reports.
15. The user can search or ask questions from the local archive.

## 7. Functional Requirements

### FR-001 — Scope Configuration

The user must be able to define:

- Starting URL
- Allowed origin
- Allowed path prefix
- Maximum pages
- Maximum crawl depth
- Request delay
- Retry limit
- Optional exclusion patterns

### FR-002 — URL Normalization

The system must normalize URLs before queue insertion by:

- Resolving relative URLs
- Removing fragments
- Normalizing default ports
- Removing known tracking parameters when configured
- Sorting retained query parameters deterministically
- Resolving redundant path segments
- Treating equivalent trailing-slash forms consistently

### FR-003 — Safe Link Filtering

The system must reject links that:

- Use unsupported protocols
- Leave the allowed origin
- Leave the allowed path
- Match blocked extensions
- Match unsafe account-action patterns
- Exceed depth or page limits
- Have already been visited or queued

### FR-004 — Crawl Queue

The crawler must maintain explicit states:

- discovered
- queued
- fetching
- extracted
- validated
- completed
- skipped
- failed
- cancelled

### FR-005 — Content Extraction

The extractor must preserve:

- Page title
- Canonical source URL
- Heading hierarchy
- Paragraphs
- Ordered and unordered lists
- Tables
- Preformatted text
- Code blocks and language hints
- Relevant links
- Callouts when semantically meaningful

The extractor must remove or down-rank:

- Navigation menus
- Headers and footers
- Cookie banners
- Advertisements
- Repeated sidebars
- Empty containers
- Hidden content
- Repeated interface labels

### FR-006 — Quality Checking

Each extracted page must receive quality signals such as:

- Text length
- Heading count
- Content density
- Duplicate ratio
- Boilerplate ratio
- Structural completeness
- Code preservation
- Table preservation
- Link integrity
- Extraction warnings

### FR-007 — Failure Recovery

The system may retry:

- Temporary network errors
- Timeouts
- Rate-limit responses after delay
- Empty responses likely caused by incomplete loading

The system must not retry indefinitely.

### FR-008 — Local Persistence

The extension must persist:

- Crawl configuration
- Queue state
- Page records
- Failure records
- Archive metadata
- Local search index

IndexedDB is the primary storage mechanism. Small preferences may use `chrome.storage.local`.

### FR-009 — Export

The system must export:

- `documentation.md`
- `documentation.json`
- `crawl-report.json`
- `failed-pages.json` when failures exist

### FR-010 — Local Search

The search engine must support:

- Token search
- Phrase preference
- Heading weighting
- Section-level ranking
- Source filtering
- Deterministic scoring

### FR-011 — Extractive Question Answering

Question answering must:

- Search only the local archive
- Return one or more relevant passages
- Include source page URLs
- Distinguish exact evidence from weak matches
- State when evidence is insufficient
- Avoid fabricated synthesis

## 8. Non-Functional Requirements

### NFR-001 — Privacy

Archived content and user questions must remain local unless the user explicitly exports files.

### NFR-002 — Determinism

The same page set and configuration should produce the same normalized ordering and export structure where network content is unchanged.

### NFR-003 — Safety

Every navigation candidate must pass scope and action-safety validation before fetching.

### NFR-004 — Performance

The project must minimize:

- Duplicate network requests
- Repeated DOM parsing
- Unbounded in-memory page retention
- Large synchronous tasks on the UI thread
- Full-index rebuilds after every page

### NFR-005 — Resumability

A browser or service-worker restart must not corrupt completed page records. Interrupted crawls should resume from persisted state when possible.

### NFR-006 — Explainability

Crawler decisions should be inspectable through reason codes such as:

- `OUTSIDE_ORIGIN`
- `OUTSIDE_PATH`
- `DUPLICATE_URL`
- `BLOCKED_EXTENSION`
- `MAX_DEPTH_REACHED`
- `UNSAFE_ACTION_LINK`
- `LOW_CONTENT_QUALITY`

### NFR-007 — Testability

Core algorithms must be implemented as pure functions wherever possible so they can be tested independently from Chrome APIs.

## 9. Data Entities

### 9.1 Crawl Configuration

```text
CrawlConfig
- startUrl
- allowedOrigin
- allowedPathPrefix
- maxPages
- maxDepth
- requestDelayMs
- retryLimit
- includePatterns
- excludePatterns
- exportOptions
```

### 9.2 URL Record

```text
UrlRecord
- normalizedUrl
- discoveredFrom
- depth
- state
- priority
- attempts
- discoveredAt
- lastUpdatedAt
- reasonCode
```

### 9.3 Page Record

```text
PageRecord
- id
- url
- canonicalUrl
- title
- headings
- sections
- links
- plainText
- markdown
- contentHash
- structureHash
- qualityScore
- warnings
- fetchedAt
- extractionVersion
```

### 9.4 Section Record

```text
SectionRecord
- id
- pageId
- headingPath
- headingLevel
- text
- markdown
- tokens
- sourceUrl
- order
```

### 9.5 Failure Record

```text
FailureRecord
- url
- stage
- errorCode
- message
- recoverable
- attempt
- timestamp
```

## 10. Completion Definition for Version 1.0

Version 1.0 is complete only when:

- A user can install the extension through Load Unpacked.
- A documentation site can be crawled within configured limits.
- The crawl can be paused, resumed, and cancelled.
- Duplicate and out-of-scope URLs are rejected correctly.
- Main content, headings, lists, tables, and code blocks are preserved.
- Markdown and JSON archives are generated.
- Failed and skipped pages are reported with reasons.
- Local search returns relevant sections.
- Extractive question answering cites source pages.
- Automated tests cover core normalization, filtering, extraction, ranking, and export behavior.
- No external package, backend, cloud database, or hosted AI API is required.
