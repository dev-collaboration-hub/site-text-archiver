# Site Text Archiver — System Architecture

## 1. Architectural Style

Site Text Archiver uses a modular, event-driven, local-first architecture designed for Chrome Manifest V3.

The system is divided into five layers:

1. User interface layer
2. Orchestration layer
3. Crawl and extraction layer
4. Intelligence and validation layer
5. Persistence and export layer

Every module has a narrow responsibility. Core algorithms should remain independent of Chrome APIs wherever practical.

## 2. High-Level Data Flow

```text
User configuration
       |
       v
Crawl planner
       |
       v
Priority task queue
       |
       v
Safe URL filter --> rejected/skipped report
       |
       v
Page fetcher
       |
       v
DOM parser
       |
       v
Content extractor
       |
       v
Quality checker --> retry/recovery decision
       |
       v
Page storage
       |
       +--> local indexer --> local search and question answering
       |
       +--> archive builder --> validator --> Markdown/JSON export
```

## 3. Runtime Components

### 3.1 Popup

The popup is the entry point for quick configuration and crawl control.

Responsibilities:

- Read the active tab URL
- Display starting origin and path
- Accept basic crawl limits
- Start, pause, resume, or cancel a crawl
- Show compact status
- Open the dashboard

The popup must not contain crawler business logic.

### 3.2 Dashboard

The dashboard provides detailed crawl visibility.

Responsibilities:

- Show queue and page statistics
- Display current task
- List completed, failed, and skipped pages
- Show decision reason codes
- Display quality warnings
- Provide export controls
- Provide local search and question-answering UI

### 3.3 Background Service Worker

The Manifest V3 service worker coordinates extension events.

Responsibilities:

- Receive commands from popup and dashboard
- Start and stop orchestration
- Restore persisted crawl state
- Dispatch work to pure modules
- Publish progress events
- Handle downloads and alarms

Because service workers can be suspended, all important state transitions must be persisted.

### 3.4 Offscreen Document or Worker Context

Long parsing and indexing tasks should not block the user interface. Depending on browser constraints, the project may use:

- Web Workers for computation-heavy pure algorithms
- An offscreen document for DOM-dependent operations not suitable for the service worker

The architecture must avoid assuming that the service worker remains alive continuously.

## 4. Core Modules

### 4.1 Agent Controller

The agent controller is a deterministic coordinator, not a general language model.

Responsibilities:

- Convert crawl goals into tasks
- Select the next task
- Track task results
- Trigger validation
- Decide between accept, retry, skip, or stop
- Enforce safety and resource limits

Input:

```text
CrawlConfig + CurrentState + LatestTaskResult
```

Output:

```text
NextAction + ReasonCode + UpdatedState
```

### 4.2 Planner

The planner builds an initial crawl strategy.

It should consider:

- Starting URL
- Path depth
- Known documentation URL patterns
- Navigation labels
- Sitemap hints
- User limits
- Exclusion rules

The first implementation should use explicit heuristics, not opaque prediction.

### 4.3 Task Queue

The task queue stores crawl tasks with priority.

Recommended priority signals:

- Lower depth first
- Same documentation section preference
- URL pattern relevance
- Navigation prominence
- Parent-page order
- Retry penalty

The queue must remain deterministic when priorities are equal.

### 4.4 URL Normalizer

The URL normalizer converts raw links into canonical comparison keys.

Pipeline:

1. Resolve against the parent URL.
2. Reject unsupported protocols.
3. Lowercase scheme and host.
4. Remove fragment.
5. Remove default port.
6. Normalize pathname.
7. Apply query-parameter policy.
8. Normalize trailing slash.
9. Serialize canonical form.

The output must include both the canonical URL and any transformation warnings.

### 4.5 Scope Guard

The scope guard decides whether a URL may be fetched.

Checks:

- Supported scheme
- Allowed origin
- Allowed path prefix
- Include/exclude patterns
- File-extension policy
- Unsafe action keywords
- Maximum depth
- Maximum page count
- Duplicate state

Every rejection must produce a machine-readable reason code.

### 4.6 Fetcher

The fetcher retrieves page HTML under strict controls.

Responsibilities:

- Apply delay policy
- Attach safe request options
- Enforce timeout
- Classify response status
- Detect non-HTML content
- Return recoverability metadata

The fetcher should not automatically follow decisions that bypass the scope guard.

### 4.7 Content Extractor

The content extractor converts a DOM into a semantic page record.

Processing stages:

1. Remove scripts, styles, templates, and hidden nodes.
2. Identify candidate main-content containers.
3. Score candidates by text density and semantic structure.
4. Penalize link-heavy or repeated navigation regions.
5. Select or merge valid content roots.
6. Walk semantic elements in document order.
7. Preserve heading hierarchy.
8. Convert supported structures into normalized blocks.
9. Record extraction warnings.

### 4.8 Boilerplate Detector

The boilerplate detector identifies repeated text across pages.

Signals may include:

- Exact normalized text hashes
- Repeated short blocks
- High link density
- Stable location patterns
- Cross-page frequency
- Navigation vocabulary

Boilerplate removal should be conservative. Content must not be deleted only because it appears more than once.

### 4.9 Duplicate Detector

The duplicate detector operates at two levels:

1. URL-level duplicate detection
2. Content-level duplicate detection

Content comparison can use:

- Normalized text hash for exact duplicates
- Shingle overlap for near duplicates
- Heading-path similarity
- Structure hash

Near-duplicate pages should be linked in the report instead of silently discarded.

### 4.10 Quality Checker

The quality checker generates a score and warnings.

Suggested score dimensions:

- Presence of title
- Meaningful text length
- Heading structure
- Content density
- Boilerplate ratio
- Duplicate ratio
- Code and table preservation
- Broken hierarchy
- Empty or malformed output

The quality checker does not rewrite content. It reports evidence to the controller.

### 4.11 Recovery Manager

The recovery manager classifies failures.

Possible outcomes:

- Retry immediately
- Retry after delay
- Re-extract with alternate content root
- Accept with warning
- Skip permanently
- Stop crawl because of global failure

Retry count must be bounded and persisted.

### 4.12 Archive Builder

The archive builder orders pages and constructs exports.

Ordering rules should prefer:

1. Starting page
2. Site navigation order where known
3. Lower depth
4. Stable discovery order
5. Canonical URL as final tie-breaker

### 4.13 Local Indexer

The local indexer creates a section-level inverted index.

Index fields:

- Normalized token
- Document frequency
- Section frequency
- Heading occurrence
- Body occurrence
- Positions when needed for phrase preference
- Page and section identifiers

The initial implementation can use deterministic TF-IDF-like scoring without external libraries.

### 4.14 Question Answering Engine

The question-answering engine is extractive.

Pipeline:

1. Normalize the question.
2. Identify important tokens and phrases.
3. Retrieve candidate sections.
4. Rank candidates.
5. Extract the smallest useful supporting passages.
6. Return source URLs and confidence indicators.
7. Report insufficient evidence when necessary.

It must never present unsupported generated facts as archive content.

## 5. Persistence Architecture

### 5.1 IndexedDB Stores

Recommended object stores:

```text
crawlConfigs
crawlRuns
urlRecords
pageRecords
sectionRecords
failureRecords
indexTerms
indexPostings
agentEvents
```

### 5.2 Transaction Rules

- Queue state and task result updates should be atomic where possible.
- A page must not be marked completed before its page record is stored.
- Index updates should reference an existing page record.
- Export generation should read from an immutable crawl snapshot.

## 6. Messaging Architecture

Suggested message format:

```json
{
  "type": "CRAWL_START",
  "requestId": "unique-id",
  "crawlId": "crawl-id",
  "payload": {},
  "timestamp": 0
}
```

Response format:

```json
{
  "type": "CRAWL_START_RESULT",
  "requestId": "unique-id",
  "ok": true,
  "payload": {},
  "error": null
}
```

Progress events should be idempotent and safe to replay in the dashboard.

## 7. State Machine

```text
IDLE
  -> PLANNING
  -> READY
  -> RUNNING
  -> PAUSING
  -> PAUSED
  -> RUNNING
  -> FINALIZING
  -> COMPLETED
```

Terminal alternatives:

```text
CANCELLED
FAILED
```

Invalid transitions must be rejected explicitly.

## 8. Security Boundaries

- Never execute extracted scripts.
- Treat page HTML as untrusted input.
- Sanitize content before rendering it in extension pages.
- Use text rendering instead of raw HTML whenever possible.
- Keep permissions minimal.
- Validate every message payload.
- Do not permit arbitrary file-system paths.
- Do not upload content automatically.

## 9. Performance Strategy

- Use incremental storage instead of retaining the entire crawl in memory.
- Batch index writes.
- Hash normalized content once.
- Avoid repeated DOM walks.
- Yield during large computations.
- Apply configurable request delays.
- Limit concurrent page processing.
- Prefer bounded queues and bounded retries.

## 10. Proposed Repository Structure

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
│   ├── shared/
│   └── messaging/
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

## 11. Architectural Decision Principles

When multiple solutions are possible, prefer the option that is:

1. Safer
2. Easier to test
3. More deterministic
4. More local and private
5. Less dependent on browser lifecycle assumptions
6. Lower in memory and CPU cost
7. Easier for contributors to understand
