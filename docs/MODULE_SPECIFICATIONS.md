# Site Text Archiver — Detailed Module Specifications

## 1. Purpose

This document defines the implementation contract for every major module in Site Text Archiver. It converts the system architecture into file-level responsibilities, public interfaces, input and output structures, algorithms, failure behavior, tests, and completion criteria.

The project must remain local-first and scratch-built using plain JavaScript, HTML, CSS, Chrome Extension APIs, IndexedDB, DOMParser, Web Workers, and other browser-native capabilities. Core algorithms must not depend on npm packages, external AI APIs, a backend server, or cloud storage.

## 2. Shared Design Rules

Every module must follow these rules:

1. A module must have one primary responsibility.
2. Core algorithms should be pure functions wherever possible.
3. Chrome APIs must be isolated behind adapters.
4. Every rejected action must return a machine-readable reason code.
5. Every asynchronous operation must have bounded timeout or cancellation behavior.
6. Important state changes must be persisted because Manifest V3 service workers may stop at any time.
7. Untrusted page HTML must never be rendered directly in extension pages.
8. Outputs must be deterministic when inputs are unchanged.
9. No placeholder behavior may be counted as a completed module.
10. Public functions must validate their inputs.

## 3. Shared Result Contract

Public module operations should return a result object rather than throwing for expected failures.

```js
{
  ok: true,
  value: {},
  warnings: [],
  error: null
}
```

Failure form:

```js
{
  ok: false,
  value: null,
  warnings: [],
  error: {
    code: "ERROR_CODE",
    message: "Human-readable explanation",
    recoverable: false,
    details: {}
  }
}
```

Unexpected programming errors may still throw, but they must be caught at orchestration boundaries and converted into structured failure records.

## 4. Shared Identifiers

Identifiers should be stable strings:

```text
crawlId   = crawl_<timestamp>_<random>
pageId    = page_<content-derived-or-generated-id>
sectionId = <pageId>:section:<order>
requestId = req_<timestamp>_<random>
taskId    = task_<crawlId>_<sequence>
```

Random components should use `crypto.getRandomValues()` rather than `Math.random()` where uniqueness matters.

---

# Part I — User Interface Modules

## 5. Popup Module

### 5.1 Suggested Files

```text
popup/popup.html
popup/popup.css
popup/popup.js
```

### 5.2 Purpose

The popup provides a compact entry point for starting and controlling a crawl. It contains no crawling, extraction, ranking, or persistence logic.

### 5.3 Responsibilities

- Read the active tab URL.
- Derive a suggested origin and path prefix.
- Display crawl configuration fields.
- Validate basic user input before sending commands.
- Start, pause, resume, and cancel a crawl.
- Display compact crawl status.
- Open the dashboard.
- Display safe, readable errors.

### 5.4 Inputs

- Active tab URL from `chrome.tabs.query()`.
- Current crawl status from the background service worker.
- User configuration fields.

### 5.5 Outputs

- `CRAWL_CREATE`
- `CRAWL_START`
- `CRAWL_PAUSE`
- `CRAWL_RESUME`
- `CRAWL_CANCEL`
- `DASHBOARD_OPEN`

### 5.6 Required UI Fields

```text
Start URL
Allowed origin
Allowed path prefix
Maximum pages
Maximum depth
Request delay in milliseconds
Retry limit
Exclude patterns
```

### 5.7 Validation Rules

- Start URL must use HTTP or HTTPS.
- Allowed origin must match the start URL unless the user explicitly edits it.
- Numeric values must be integers within configured safety ranges.
- Empty exclusion patterns must be removed.
- Start must be disabled while a crawl is already running unless a separate crawl is supported later.

### 5.8 Completion Criteria

- Popup opens without console errors.
- It correctly reads the active tab URL.
- Invalid input never reaches the crawler.
- Every control sends the correct typed message.
- Popup remains functional after the service worker restarts.

---

## 6. Dashboard Module

### 6.1 Suggested Files

```text
dashboard/dashboard.html
dashboard/dashboard.css
dashboard/dashboard.js
dashboard/components/*.js
```

### 6.2 Purpose

The dashboard gives detailed visibility into crawl state, decisions, quality, failures, search, question answering, and exports.

### 6.3 Responsibilities

- Display crawl configuration and lifecycle state.
- Show counts for queued, fetching, completed, skipped, and failed tasks.
- Show current task and recent agent events.
- List page records with quality scores and warnings.
- Inspect skipped and failed URLs with reason codes.
- Provide search and extractive QA interfaces.
- Trigger Markdown, JSON, and report exports.
- Restore its view from persisted state after reload.

### 6.4 Rendering Safety

- Use `textContent` for untrusted strings.
- Do not assign extracted HTML to `innerHTML`.
- Sanitize URLs before creating links.
- Use `rel="noopener noreferrer"` for external links.
- Do not execute inline event handlers from archived content.

### 6.5 Data Loading Strategy

The dashboard should request paginated or summarized data rather than loading the entire archive into memory.

Suggested queries:

```text
GET_CRAWL_SUMMARY
GET_PAGE_LIST
GET_FAILURE_LIST
GET_AGENT_EVENTS
SEARCH_ARCHIVE
ASK_ARCHIVE
EXPORT_ARCHIVE
```

### 6.6 Completion Criteria

- Dashboard remains responsive with large archives.
- Reloading the page does not lose visible crawl state.
- Filters and pagination operate deterministically.
- All displayed external content is safely rendered.

---

# Part II — Runtime and Orchestration Modules

## 7. Background Service Worker

### 7.1 Suggested Files

```text
src/background/service-worker.js
src/background/runtime-controller.js
src/background/alarm-adapter.js
src/background/download-adapter.js
```

### 7.2 Purpose

The service worker is the extension runtime entry point. It receives events, restores state, invokes pure modules, and publishes progress.

### 7.3 Responsibilities

- Register runtime message listeners.
- Restore incomplete crawl runs.
- Route validated commands to the orchestrator.
- Schedule delayed work through alarms when appropriate.
- Coordinate offscreen documents or workers.
- Handle downloads.
- Publish replay-safe status events.
- Convert uncaught errors into failure records.

### 7.4 Lifecycle Constraint

No important state may exist only in service-worker memory. Before acknowledging an irreversible transition, the worker must persist it.

### 7.5 Startup Procedure

1. Open storage.
2. Read active crawl runs.
3. Validate persisted records.
4. Repair recoverable interrupted states.
5. Reconstruct the next runnable task.
6. Publish a restored status event.

### 7.6 Completion Criteria

- Worker suspension does not corrupt completed work.
- Restart restores a paused or interrupted crawl correctly.
- Duplicate commands with the same `requestId` are handled idempotently.

---

## 8. Message Router and Contract Validator

### 8.1 Suggested Files

```text
src/messaging/message-types.js
src/messaging/message-validator.js
src/messaging/message-router.js
src/messaging/event-publisher.js
```

### 8.2 Purpose

Provide typed, validated communication among popup, dashboard, service worker, workers, and offscreen contexts.

### 8.3 Message Envelope

```js
{
  type: "CRAWL_START",
  requestId: "req_...",
  crawlId: "crawl_...",
  payload: {},
  timestamp: 0,
  version: 1
}
```

### 8.4 Responsibilities

- Validate envelope fields.
- Validate type-specific payloads.
- Reject unknown message types.
- Route messages to registered handlers.
- Enforce response correlation through `requestId`.
- Prevent accidental processing of stale protocol versions.

### 8.5 Error Codes

```text
INVALID_MESSAGE
UNKNOWN_MESSAGE_TYPE
INVALID_MESSAGE_VERSION
INVALID_PAYLOAD
MISSING_REQUEST_ID
HANDLER_NOT_FOUND
HANDLER_FAILED
```

### 8.6 Completion Criteria

- Every message type has a validator.
- Invalid messages cannot invoke business logic.
- Replies preserve the original request ID.

---

## 9. Agent Controller

### 9.1 Suggested Files

```text
agent/controller.js
agent/action-types.js
agent/reason-codes.js
```

### 9.2 Purpose

The agent controller is a deterministic decision coordinator. It is not a generative model.

### 9.3 Inputs

```text
CrawlConfig
CrawlRunState
NextTaskCandidate
LatestTaskResult
QualityEvidence
FailureEvidence
ResourceLimits
```

### 9.4 Outputs

```js
{
  action: "ACCEPT_PAGE | RETRY_FETCH | RETRY_EXTRACTION | SKIP_PAGE | FETCH_NEXT | FINALIZE | STOP",
  reasonCode: "...",
  evidence: {},
  statePatch: {},
  tasksToAdd: []
}
```

### 9.5 Decision Priority

1. User cancellation.
2. Global safety violation.
3. Hard resource limit.
4. Permanent task failure.
5. Recoverable failure with retries remaining.
6. Extraction quality failure.
7. Valid page acceptance.
8. Queue continuation.
9. Finalization.

### 9.6 Required Invariants

- Retry count never exceeds configuration.
- Unsafe URLs can never be reintroduced.
- A page cannot become completed before storage succeeds.
- Every decision produces a reason code and evidence.
- The same state and result produce the same decision.

### 9.7 Completion Criteria

- All decision branches are unit tested.
- Event logs can explain why each page was accepted, retried, skipped, or failed.

---

## 10. Crawl Planner

### 10.1 Suggested Files

```text
agent/planner.js
agent/navigation-analyzer.js
agent/url-pattern-scorer.js
```

### 10.2 Purpose

Create the initial crawl plan and assign early priorities using explicit heuristics.

### 10.3 Inputs

- Validated crawl configuration.
- Starting page metadata.
- Starting page links.
- Navigation labels and document structure.
- Optional sitemap hints.

### 10.4 Planning Signals

- Lower path depth.
- Same allowed path prefix.
- Documentation keywords such as guide, docs, API, reference, tutorial, install.
- Navigation placement.
- Link order on the parent page.
- Penalized action or marketing vocabulary.
- User include and exclude rules.

### 10.5 Output

```js
{
  crawlId: "...",
  seedTasks: [],
  priorityPolicyVersion: 1,
  warnings: [],
  planSummary: {}
}
```

### 10.6 Completion Criteria

- Planning is deterministic.
- Every priority contribution is inspectable.
- The planner cannot bypass the scope guard.

---

## 11. Crawl State Machine

### 11.1 Suggested Files

```text
src/crawler/crawl-state.js
src/crawler/state-transition.js
```

### 11.2 States

```text
IDLE
PLANNING
READY
RUNNING
PAUSING
PAUSED
FINALIZING
COMPLETED
CANCELLED
FAILED
```

### 11.3 Valid Transition Examples

```text
IDLE -> PLANNING
PLANNING -> READY
READY -> RUNNING
RUNNING -> PAUSING
PAUSING -> PAUSED
PAUSED -> RUNNING
RUNNING -> FINALIZING
FINALIZING -> COMPLETED
Any non-terminal state -> CANCELLED
Any non-terminal state -> FAILED
```

### 11.4 Public API

```js
canTransition(from, to)
transition(state, event)
isTerminal(state)
```

### 11.5 Error Codes

```text
INVALID_STATE
INVALID_TRANSITION
TERMINAL_STATE_LOCKED
STATE_VERSION_MISMATCH
```

### 11.6 Completion Criteria

- Invalid transitions have no side effects.
- Transition tests cover every state and event pair.

---

## 12. Priority Task Queue

### 12.1 Suggested Files

```text
agent/task-queue.js
src/crawler/task-record.js
```

### 12.2 Purpose

Maintain deterministic pending work with bounded size and stable tie-breaking.

### 12.3 Task Record

```js
{
  taskId,
  crawlId,
  url,
  canonicalKey,
  parentUrl,
  depth,
  priorityScore,
  discoveryOrder,
  attempt,
  state,
  availableAt,
  createdAt,
  updatedAt
}
```

### 12.4 Priority Ordering

1. Higher explicit priority score.
2. Lower retry count.
3. Lower depth.
4. Earlier discovery order.
5. Canonical URL lexical order.

### 12.5 Public API

```js
enqueue(task)
enqueueMany(tasks)
peek(now)
dequeue(now)
markState(taskId, state)
remove(taskId)
size()
snapshot()
restore(snapshot)
```

### 12.6 Invariants

- One active queue entry per canonical URL per crawl.
- Equal inputs produce equal ordering.
- Delayed retry tasks cannot run before `availableAt`.
- Queue size never exceeds configured hard limit.

### 12.7 Completion Criteria

- Duplicate insertion is rejected or merged predictably.
- Queue restoration preserves order exactly.

---

# Part III — URL and Network Modules

## 13. URL Resolver and Normalizer

### 13.1 Suggested Files

```text
src/crawler/url-resolver.js
src/crawler/url-normalizer.js
src/crawler/query-policy.js
```

### 13.2 Purpose

Convert raw links into stable canonical URLs and comparison keys.

### 13.3 Public API

```js
resolveUrl(rawUrl, parentUrl)
normalizeUrl(url, policy)
createCanonicalKey(normalizedUrl)
```

### 13.4 Normalization Pipeline

1. Trim surrounding whitespace.
2. Resolve relative URL against parent URL.
3. Reject unsupported schemes.
4. Lowercase scheme and hostname.
5. Remove fragments.
6. Remove default ports.
7. Resolve dot segments.
8. Normalize duplicate slashes in the path without damaging the scheme.
9. Decode only safe unreserved path characters.
10. Apply query-parameter policy.
11. Sort retained query parameters.
12. Apply trailing-slash policy.
13. Serialize canonical form.

### 13.5 Query Policy

Default removable tracking parameters may include:

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
gclid
fbclid
```

Potentially content-changing parameters must be retained unless explicitly configured otherwise.

### 13.6 Output

```js
{
  originalUrl,
  resolvedUrl,
  normalizedUrl,
  canonicalKey,
  removedParameters: [],
  warnings: []
}
```

### 13.7 Completion Criteria

- Equivalent URL forms map to one canonical key.
- Distinct content URLs are not incorrectly merged.
- Test coverage includes fragments, ports, Unicode, encoded paths, queries, and trailing slashes.

---

## 14. Scope Guard and Safe-Link Filter

### 14.1 Suggested Files

```text
src/crawler/scope-guard.js
src/crawler/link-safety.js
src/crawler/blocked-extensions.js
```

### 14.2 Purpose

Make the final decision on whether a normalized URL may enter the crawl queue.

### 14.3 Checks

1. Supported scheme.
2. Exact allowed origin.
3. Allowed path prefix using path-segment-aware comparison.
4. Include pattern match when configured.
5. Exclude pattern rejection.
6. Blocked downloadable extension.
7. Unsafe action keyword.
8. Maximum depth.
9. Maximum pages.
10. Already queued, visited, skipped, or completed.

### 14.4 Unsafe Action Patterns

Examples:

```text
logout
signout
delete
remove-account
unsubscribe
purchase
checkout
billing
revoke
reset-password
```

Matching must examine path segments and relevant query keys without treating ordinary documentation text as an action automatically.

### 14.5 Output

```js
{
  allowed: false,
  reasonCode: "OUTSIDE_ORIGIN",
  evidence: {
    expectedOrigin: "...",
    actualOrigin: "..."
  }
}
```

### 14.6 Reason Codes

```text
UNSUPPORTED_PROTOCOL
OUTSIDE_ORIGIN
OUTSIDE_PATH
INCLUDE_PATTERN_MISS
EXCLUDED_PATTERN
BLOCKED_EXTENSION
UNSAFE_ACTION_LINK
MAX_DEPTH_REACHED
MAX_PAGE_LIMIT
DUPLICATE_URL
INVALID_URL
```

### 14.7 Completion Criteria

- No rejected link reaches the fetcher.
- Every rejection is recorded with reason and source page.

---

## 15. Page Fetcher

### 15.1 Suggested Files

```text
src/crawler/fetcher.js
src/crawler/response-classifier.js
src/crawler/fetch-policy.js
```

### 15.2 Purpose

Retrieve approved HTML pages using bounded, classifiable network operations.

### 15.3 Input

```js
{
  url,
  timeoutMs,
  requestDelayMs,
  attempt,
  signal
}
```

### 15.4 Fetch Rules

- Use GET only.
- Apply configured request delay.
- Use `AbortController` for timeout and cancellation.
- Do not send custom credentials beyond browser defaults unless explicitly required by the approved design.
- Reject non-HTTP(S) redirects.
- Revalidate the final response URL through the scope guard.
- Process only HTML-compatible content types.
- Bound response size where browser capabilities permit.

### 15.5 Response Classification

```text
2xx HTML -> success
2xx non-HTML -> permanent skip
3xx final URL in scope -> continue
3xx final URL out of scope -> permanent skip
401/403 -> permanent access failure
404/410 -> permanent missing page
408/425/429 -> recoverable with delay
5xx -> usually recoverable within retry limit
network error -> recoverable classification
abort by user -> cancelled
abort by timeout -> recoverable timeout
```

### 15.6 Output

```js
{
  requestedUrl,
  finalUrl,
  status,
  contentType,
  html,
  bytesEstimate,
  fetchedAt,
  recoverable,
  retryAfterMs,
  warnings: []
}
```

### 15.7 Completion Criteria

- Timeouts terminate cleanly.
- Cancellation stops pending work.
- Final redirect URL is revalidated.
- Non-HTML content is never passed to extraction.

---

## 16. Link Discovery Module

### 16.1 Suggested Files

```text
src/crawler/link-discovery.js
src/crawler/base-url.js
```

### 16.2 Purpose

Extract crawl candidates from fetched documents without deciding final eligibility.

### 16.3 Sources

- Anchor `href` attributes.
- Canonical link metadata.
- Navigation regions.
- Optional sitemap links discovered from page markup.
- Next/previous documentation controls.

### 16.4 Output Record

```js
{
  rawUrl,
  sourceUrl,
  anchorText,
  rel,
  domOrder,
  contextType,
  parentDepth
}
```

### 16.5 Rules

- Ignore empty links and fragment-only links.
- Do not execute JavaScript URLs.
- Preserve DOM discovery order.
- Pass every candidate through the URL normalizer and scope guard.
- Do not write directly to the queue.

### 16.6 Completion Criteria

- Base URL behavior is correct.
- Duplicate raw links remain traceable but produce one canonical queue candidate.

---

# Part IV — Parsing and Extraction Modules

## 17. DOM Parser and Sanitization Module

### 17.1 Suggested Files

```text
src/extraction/dom-parser.js
src/extraction/dom-cleaner.js
src/extraction/visibility.js
```

### 17.2 Purpose

Parse untrusted HTML into an isolated DOM and remove nodes that must never participate in extraction.

### 17.3 Mandatory Removals

```text
script
style
noscript
template
iframe
object
embed
canvas when it contains no accessible text
form controls unrelated to documentation
hidden nodes
```

### 17.4 Hidden Detection Signals

- `hidden` attribute.
- `aria-hidden="true"`.
- Inline `display:none` or `visibility:hidden`.
- Known collapsed template containers when safely identifiable.

The parser does not execute page scripts and does not attach parsed nodes to extension UI documents.

### 17.5 Output

```js
{
  document,
  metadata,
  removalStats,
  warnings
}
```

### 17.6 Completion Criteria

- Scripts cannot execute.
- Malformed HTML produces a usable document or a structured parse failure.

---

## 18. Main-Content Detector

### 18.1 Suggested Files

```text
src/extraction/main-content-detector.js
src/extraction/content-density.js
src/extraction/candidate-scorer.js
```

### 18.2 Purpose

Select the DOM region most likely to contain the primary documentation content.

### 18.3 Candidate Sources

- `main`
- `article`
- `[role="main"]`
- Known content-like IDs or classes.
- Large semantic containers.
- Body fallback.

### 18.4 Suggested Score

```text
score =
  textLengthWeight
+ paragraphWeight
+ headingWeight
+ codeBlockWeight
+ tableWeight
- linkDensityPenalty
- navigationKeywordPenalty
- repeatedClassPenalty
- formControlPenalty
- veryShortContentPenalty
```

Every component must be inspectable in the returned evidence.

### 18.5 Multi-Root Policy

Multiple adjacent content roots may be merged only when:

- They belong to the same semantic content region.
- Their document order is stable.
- They do not introduce dominant navigation or footer content.

### 18.6 Output

```js
{
  selectedRoots: [],
  candidateScores: [],
  confidence: 0,
  warnings: []
}
```

### 18.7 Completion Criteria

- Article-style and sidebar-heavy test fixtures select useful content.
- Low-confidence selection is flagged rather than hidden.

---

## 19. Semantic Content Extractor

### 19.1 Suggested Files

```text
src/extraction/content-extractor.js
src/extraction/block-walker.js
src/extraction/heading-extractor.js
src/extraction/list-extractor.js
src/extraction/table-extractor.js
src/extraction/code-extractor.js
src/extraction/link-extractor.js
```

### 19.2 Purpose

Convert selected DOM roots into a normalized semantic page representation.

### 19.3 Supported Block Types

```text
heading
paragraph
ordered-list
unordered-list
list-item
table
code-block
blockquote
callout
horizontal-rule
image-alt-text when useful
```

### 19.4 Normalized Block Shape

```js
{
  type: "paragraph",
  order: 10,
  text: "...",
  level: null,
  language: null,
  rows: null,
  links: [],
  sourcePath: "DOM path or diagnostic locator"
}
```

### 19.5 Heading Rules

- Preserve original level.
- Track logical heading path.
- Flag jumps greater than one level.
- Generate no invented headings during extraction.
- Empty headings are ignored with warnings.

### 19.6 List Rules

- Preserve ordered versus unordered type.
- Preserve nesting depth.
- Avoid merging separate lists.
- Keep code and paragraphs inside list items when possible.

### 19.7 Table Rules

- Preserve header cells.
- Preserve row and column order.
- Expand simple `rowspan` and `colspan` into a normalized rectangular representation when feasible.
- Flag complex unsupported spans rather than silently corrupting the table.

### 19.8 Code Rules

- Preserve whitespace.
- Detect language hints from class names such as `language-js`.
- Distinguish inline code from block code.
- Do not normalize internal code spacing.

### 19.9 Page Record Output

```js
{
  pageId,
  url,
  canonicalUrl,
  title,
  description,
  headings: [],
  blocks: [],
  links: [],
  plainText,
  extractionWarnings: [],
  extractionVersion
}
```

### 19.10 Completion Criteria

- Technical structure remains readable.
- Tables and code blocks are not flattened incorrectly.
- Extraction order matches document order.

---

## 20. Boilerplate Detector

### 20.1 Suggested Files

```text
agent/boilerplate-detector.js
agent/block-frequency.js
```

### 20.2 Purpose

Identify repeated page furniture without deleting legitimate repeated technical content.

### 20.3 Inputs

- Normalized page blocks.
- Cross-page block frequency statistics.
- Link density.
- DOM location evidence.
- Navigation vocabulary evidence.

### 20.4 Normalization for Comparison

- Lowercase ordinary prose.
- Collapse whitespace.
- Remove purely decorative punctuation.
- Preserve technical tokens where possible.
- Hash normalized block text.

### 20.5 Classification

```text
CONTENT
POSSIBLE_BOILERPLATE
LIKELY_BOILERPLATE
GLOBAL_NAVIGATION
FOOTER
UNKNOWN
```

### 20.6 Conservative Rule

Frequency alone cannot delete a block. Removal requires multiple signals such as high frequency plus navigation position or high link density.

### 20.7 Completion Criteria

- Repeated legal notices and navigation are detected.
- Repeated API parameter descriptions are not automatically removed solely due to frequency.

---

## 21. Duplicate Content Detector

### 21.1 Suggested Files

```text
agent/duplicate-detector.js
agent/text-hash.js
agent/shingling.js
```

### 21.2 Purpose

Detect exact and near-duplicate page content.

### 21.3 Exact Duplicate Method

1. Normalize meaningful page text.
2. Compute a browser-native SHA-256 hash through `crypto.subtle.digest`.
3. Compare against stored content hashes.

### 21.4 Near-Duplicate Method

Initial implementation may use word shingles:

1. Tokenize normalized content.
2. Build fixed-size shingles.
3. Hash shingles.
4. Compute overlap or Jaccard similarity.
5. Combine with heading-path and structure similarity.

### 21.5 Output

```js
{
  classification: "UNIQUE | EXACT_DUPLICATE | NEAR_DUPLICATE",
  comparedPageId,
  similarity,
  evidence: {},
  recommendedAction: "KEEP | LINK_AS_DUPLICATE | FLAG"
}
```

### 21.6 Completion Criteria

- Exact duplicates are consistently identified.
- Near-duplicate threshold is configurable and tested.
- Duplicate reports preserve source relationships.

---

## 22. Quality Checker

### 22.1 Suggested Files

```text
agent/quality-checker.js
agent/quality-metrics.js
agent/quality-thresholds.js
```

### 22.2 Purpose

Produce evidence-based extraction quality scores and warnings.

### 22.3 Metrics

```text
Title presence
Meaningful character count
Word count
Heading count
Heading hierarchy validity
Content density
Link density
Boilerplate ratio
Duplicate ratio
Code preservation
Table preservation
Empty-block ratio
Malformed structure count
```

### 22.4 Score Contract

Scores use a documented 0–100 scale. The score must include component values and weights.

```js
{
  score: 78,
  classification: "GOOD | ACCEPTABLE | LOW | INVALID",
  components: {},
  warnings: [],
  recommendedAction: "ACCEPT | ACCEPT_WITH_WARNING | RETRY_EXTRACTION | SKIP"
}
```

### 22.5 Important Rule

The quality checker recommends; the agent controller decides.

### 22.6 Completion Criteria

- Two runs on the same page record produce identical scores.
- Threshold boundary tests are included.

---

## 23. Recovery Manager

### 23.1 Suggested Files

```text
agent/recovery-manager.js
agent/retry-policy.js
agent/backoff.js
```

### 23.2 Purpose

Classify failures and recommend bounded recovery actions.

### 23.3 Inputs

- Failure stage.
- Error code.
- HTTP status.
- Attempt count.
- Retry limit.
- Optional `Retry-After` value.
- Previous extraction evidence.

### 23.4 Possible Actions

```text
RETRY_IMMEDIATE
RETRY_AFTER_DELAY
RETRY_ALTERNATE_ROOT
ACCEPT_WITH_WARNING
SKIP_PERMANENT
STOP_CRAWL
```

### 23.5 Backoff

A deterministic capped exponential policy may be used:

```text
delay = min(baseDelay * 2^attempt, maxDelay)
```

A server-provided valid `Retry-After` may override the calculated delay within configured safety bounds.

### 23.6 Completion Criteria

- No infinite retry path exists.
- Permanent failures are not repeatedly retried.
- Retry decisions survive restart through persisted attempt state.

---

# Part V — Persistence Modules

## 24. Storage Adapter

### 24.1 Suggested Files

```text
src/storage/database.js
src/storage/schema.js
src/storage/migrations.js
src/storage/repositories/*.js
src/storage/settings-store.js
```

### 24.2 Purpose

Provide one validated persistence interface over IndexedDB and `chrome.storage.local`.

### 24.3 IndexedDB Object Stores

```text
crawlConfigs
crawlRuns
urlRecords
tasks
pageRecords
sectionRecords
failureRecords
agentEvents
indexTerms
indexPostings
requestLedger
```

### 24.4 Required Indexes

Examples:

```text
crawlRuns: byState, byUpdatedAt
urlRecords: byCrawlAndCanonicalKey, byState
tasks: byCrawlAndState, byAvailableAt
pageRecords: byCrawlId, byCanonicalUrl, byContentHash
sectionRecords: byPageId, byCrawlId
failureRecords: byCrawlId, byStage, byErrorCode
agentEvents: byCrawlId, byTimestamp
```

### 24.5 Transaction Invariants

- Task completion and page storage must be atomic where possible.
- A completed URL record must reference an existing page record.
- A posting cannot reference a missing section.
- Export reads must use a stable crawl snapshot.
- Database migrations must be versioned and idempotent.

### 24.6 Public Repository Interfaces

```js
crawlRunRepo.create()
crawlRunRepo.get()
crawlRunRepo.updateState()
taskRepo.enqueue()
taskRepo.claimNext()
pageRepo.put()
pageRepo.getByCrawl()
failureRepo.add()
eventRepo.append()
indexRepo.putBatch()
```

### 24.7 Completion Criteria

- Browser restart preserves valid state.
- Transaction failure cannot produce false completion.
- Migration tests cover old schema fixtures.

---

## 25. Crawl Snapshot Module

### 25.1 Suggested Files

```text
src/storage/snapshot.js
src/storage/integrity-checker.js
```

### 25.2 Purpose

Create a stable, internally consistent view of a crawl for export and final validation.

### 25.3 Snapshot Contents

```text
Crawl configuration
Run metadata
Completed page records
Section records
Skipped records
Failure records
Quality summaries
Agent events summary
Index metadata
```

### 25.4 Integrity Checks

- Missing page references.
- Duplicate canonical URLs.
- Completed tasks without pages.
- Sections without pages.
- Invalid state values.
- Broken content hashes.

### 25.5 Completion Criteria

- Export never reads a partially changing dataset.
- Integrity failures are visible and do not silently produce a misleading archive.

---

# Part VI — Archive and Export Modules

## 26. Markdown Converter

### 26.1 Suggested Files

```text
src/export/markdown-converter.js
src/export/markdown-escape.js
src/export/code-fence.js
src/export/table-renderer.js
```

### 26.2 Purpose

Convert normalized semantic blocks to deterministic Markdown.

### 26.3 Rules

- Escape Markdown control characters only where required.
- Preserve heading hierarchy relative to the archive structure.
- Choose code fences longer than any backtick run inside the code.
- Render simple tables as Markdown tables.
- Fall back to readable text for tables that cannot be represented safely.
- Preserve source URLs.
- Use stable blank-line rules.
- Never inject raw untrusted HTML unless a separately reviewed policy allows a safe subset.

### 26.4 Public API

```js
pageToMarkdown(pageRecord, options)
blockToMarkdown(block, context)
escapeMarkdown(text, context)
```

### 26.5 Completion Criteria

- Output renders correctly in common Markdown viewers.
- Backticks, pipes, nested lists, and unusual headings are covered by tests.

---

## 27. Archive Builder

### 27.1 Suggested Files

```text
src/export/archive-builder.js
src/export/page-ordering.js
src/export/toc-builder.js
```

### 27.2 Purpose

Order pages and combine them into the final archive.

### 27.3 Ordering Policy

1. Start page.
2. Known navigation order.
3. Lower depth.
4. Stable discovery order.
5. Canonical URL lexical order.

### 27.4 Archive Structure

```text
Archive title
Generation metadata
Source scope
Table of contents
Page sections
Source URL per page
Warnings summary
```

### 27.5 Output

```js
{
  markdown,
  json,
  pageOrder: [],
  toc: [],
  warnings: [],
  buildVersion
}
```

### 27.6 Completion Criteria

- Same snapshot produces byte-stable output where timestamps are excluded or fixed.
- Duplicate titles have unique TOC anchors.

---

## 28. Report Generator

### 28.1 Suggested Files

```text
src/export/report-generator.js
src/export/failure-report.js
```

### 28.2 Purpose

Generate machine-readable crawl and failure reports.

### 28.3 Crawl Report Fields

```text
crawlId
startUrl
scope
startedAt
completedAt
state
counts by task state
pages exported
bytes fetched estimate
quality summary
retry summary
reason-code summary
warnings
software version
```

### 28.4 Failure Report Fields

```text
url
stage
error code
message
recoverable
attempts
final action
timestamps
source page
```

### 28.5 Completion Criteria

- Report totals reconcile with stored task records.
- Failure records are not omitted from partial exports.

---

## 29. Download Adapter

### 29.1 Suggested Files

```text
src/export/download-adapter.js
src/export/file-names.js
```

### 29.2 Purpose

Create local downloadable files through browser-native APIs.

### 29.3 Outputs

```text
documentation.md
documentation.json
crawl-report.json
failed-pages.json
```

### 29.4 Rules

- Revoke generated object URLs after use.
- Sanitize file-name components.
- Prevent path traversal characters.
- Report browser download failures clearly.

### 29.5 Completion Criteria

- Every supported export downloads successfully.
- Failed-page file is generated only when failures exist unless explicitly requested.

---

# Part VII — Local Intelligence Modules

## 30. Text Normalizer and Tokenizer

### 30.1 Suggested Files

```text
agent/text-normalizer.js
agent/tokenizer.js
agent/stop-words.js
```

### 30.2 Purpose

Create deterministic tokens for duplicate detection, indexing, search, and QA.

### 30.3 Normalization

- Unicode normalization.
- Lowercasing for ordinary language comparison.
- Whitespace collapse.
- Controlled punctuation splitting.
- Preservation of technical forms such as `C++`, `node.js`, `--flag`, file paths, and identifiers where possible.
- Optional lightweight stemming only after explicit evaluation; it is not required for v1.

### 30.4 Token Record

```js
{
  value,
  normalized,
  position,
  startOffset,
  endOffset,
  type
}
```

### 30.5 Completion Criteria

- Tokenization is stable across runs.
- Technical-token fixtures are included.

---

## 31. Section Splitter

### 31.1 Suggested Files

```text
agent/section-splitter.js
```

### 31.2 Purpose

Convert page blocks into searchable sections using heading hierarchy.

### 31.3 Rules

- A heading begins a new section.
- Introductory content before the first heading becomes an introduction section.
- Very small adjacent sections may be merged only using documented thresholds.
- Code and tables remain attached to their surrounding section.
- Each section retains heading path and source URL.

### 31.4 Output

```js
{
  sectionId,
  pageId,
  headingPath,
  headingLevel,
  text,
  markdown,
  tokens,
  order,
  sourceUrl
}
```

### 31.5 Completion Criteria

- Section order matches page order.
- No content block is lost or assigned twice.

---

## 32. Local Indexer

### 32.1 Suggested Files

```text
agent/indexer.js
agent/inverted-index.js
agent/index-batcher.js
```

### 32.2 Purpose

Build an incremental section-level inverted index.

### 32.3 Term Data

```text
term
section frequency
document frequency
total frequency
```

### 32.4 Posting Data

```text
term
sectionId
pageId
headingFrequency
bodyFrequency
positions
fieldLength
```

### 32.5 Indexing Procedure

1. Split accepted page into sections.
2. Normalize and tokenize each section.
3. Count heading and body terms separately.
4. Build postings.
5. Update document and section frequencies.
6. Write in bounded batches.
7. Mark index version for the page.

### 32.6 Invariants

- Re-indexing a page first removes or replaces its old postings.
- No posting references a missing section.
- Index updates can resume after interruption.

### 32.7 Completion Criteria

- Incremental indexing and full rebuild produce equivalent results.
- Large writes are batched to avoid blocking.

---

## 33. Search Ranker

### 33.1 Suggested Files

```text
agent/search-ranker.js
agent/snippet-builder.js
```

### 33.2 Purpose

Rank relevant sections for a local query using deterministic scoring.

### 33.3 Suggested Scoring Signals

```text
Heading term frequency
Body term frequency
Inverse document frequency
Exact phrase bonus
All-query-terms bonus
Rare-term bonus
Section-length normalization
Proximity bonus
```

A BM25-like or TF-IDF-like formula may be implemented from scratch, but its exact formula and constants must be documented in code.

### 33.4 Output

```js
{
  sectionId,
  pageId,
  score,
  matchedTerms: [],
  snippet,
  headingPath,
  sourceUrl,
  scoreBreakdown: {}
}
```

### 33.5 Completion Criteria

- Ranking is deterministic.
- Heading matches normally outrank weak body-only matches.
- Empty and stop-word-only queries return a clear result.

---

## 34. Extractive Question Answering Engine

### 34.1 Suggested Files

```text
agent/question-answering.js
agent/question-analyzer.js
agent/passage-extractor.js
agent/confidence.js
```

### 34.2 Purpose

Return relevant archived passages as answers without inventing unsupported facts.

### 34.3 Pipeline

1. Validate question.
2. Normalize and tokenize.
3. Identify important terms and phrases.
4. Retrieve candidate sections through search.
5. Rank candidate passages.
6. Select the smallest passages containing sufficient evidence.
7. Attach source URLs and heading paths.
8. Compute transparent confidence signals.
9. Return insufficient evidence when thresholds are not met.

### 34.4 Output

```js
{
  answerType: "SUPPORTED_PASSAGES | INSUFFICIENT_EVIDENCE",
  passages: [
    {
      text,
      sourceUrl,
      headingPath,
      score,
      matchedTerms
    }
  ],
  confidence: "HIGH | MEDIUM | LOW | NONE",
  explanation: ""
}
```

### 34.5 Safety Rules

- Do not generate factual sentences absent from retrieved passages.
- Do not hide conflicting passages.
- Do not claim certainty based only on a weak keyword match.
- Always show sources for supported passages.

### 34.6 Completion Criteria

- Unsupported questions return insufficient evidence.
- Direct factual questions return a concise source-backed passage.
- Multiple relevant sources can be shown.

---

## 35. Archive Validator

### 35.1 Suggested Files

```text
agent/archive-validator.js
agent/validation-rules.js
```

### 35.2 Purpose

Verify internal archive correctness before final export.

### 35.3 Validation Rules

- At least one completed page exists.
- Every exported page has a canonical source URL.
- Page order contains no duplicates.
- Heading structure is representable.
- Markdown conversion succeeded for every included page.
- Failed and skipped counts reconcile.
- Section and page references are valid.
- Search index version matches included pages when search is enabled.
- Export size stays within configured limits.

### 35.4 Output

```js
{
  valid: true,
  errors: [],
  warnings: [],
  statistics: {}
}
```

### 35.5 Completion Criteria

- Invalid archives cannot be marked as fully successful.
- Users may export a partial archive only with an explicit warning and partial status.

---

# Part VIII — Worker and Utility Modules

## 36. Worker Coordinator

### 36.1 Suggested Files

```text
workers/worker-coordinator.js
workers/index-worker.js
workers/analysis-worker.js
```

### 36.2 Purpose

Move CPU-heavy pure operations away from popup and dashboard UI threads.

### 36.3 Candidate Operations

- Large tokenization jobs.
- Shingle generation.
- Near-duplicate comparison.
- Index construction.
- Large export assembly.

### 36.4 Rules

- Worker messages use the shared message envelope.
- Tasks support cancellation.
- Large payloads are chunked or transferred efficiently.
- Worker crashes return structured errors.
- The system has a safe synchronous or batched fallback where practical.

### 36.5 Completion Criteria

- Heavy indexing does not freeze dashboard controls.
- Worker termination does not corrupt stored state.

---

## 37. Configuration Validator

### 37.1 Suggested Files

```text
src/shared/config-validator.js
src/shared/defaults.js
src/shared/limits.js
```

### 37.2 Purpose

Validate, normalize, and freeze crawl configuration before planning.

### 37.3 Default Safety Bounds

Exact values may change after testing, but must be centrally defined:

```text
maxPages: bounded positive integer
maxDepth: bounded non-negative integer
requestDelayMs: bounded non-negative integer
retryLimit: small bounded integer
timeoutMs: bounded positive integer
maxConcurrentFetches: small bounded integer
```

### 37.4 Output

```js
{
  config,
  appliedDefaults: [],
  warnings: []
}
```

### 37.5 Completion Criteria

- No module receives raw, unvalidated user configuration.

---

## 38. Logging and Agent Event Module

### 38.1 Suggested Files

```text
src/shared/logger.js
agent/event-log.js
```

### 38.2 Purpose

Provide structured diagnostics and explainable agent history without collecting external analytics.

### 38.3 Event Record

```js
{
  eventId,
  crawlId,
  taskId,
  type,
  reasonCode,
  message,
  evidence,
  timestamp,
  severity
}
```

### 38.4 Rules

- Do not log full private content by default.
- Redact sensitive query values where appropriate.
- Bound retained event volume.
- Persist important state and decision events.
- Console logging may be disabled in production builds.

### 38.5 Completion Criteria

- A failed or skipped page can be traced through its event history.

---

# Part IX — Testing Modules and Fixtures

## 39. Scratch Test Harness

### 39.1 Suggested Files

```text
tests/test-runner.html
tests/test-runner.js
tests/assert.js
tests/report.js
```

### 39.2 Purpose

Run automated tests without npm or external libraries.

### 39.3 Required Features

```js
test(name, function)
assertEqual(actual, expected)
assertDeepEqual(actual, expected)
assertTrue(value)
assertFalse(value)
assertThrows(function)
assertRejects(asyncFunction)
```

### 39.4 Test Categories

```text
unit
integration
storage migration
browser manual
security fixture
performance fixture
end-to-end
```

### 39.5 Completion Criteria

- Tests can run locally in a browser.
- Results show passed, failed, duration, and error stack.
- A failing test produces a non-ambiguous report.

---

## 40. Documentation Website Fixtures

### 40.1 Suggested Files

```text
tests/fixtures/simple-docs/
tests/fixtures/sidebar-docs/
tests/fixtures/code-heavy-docs/
tests/fixtures/table-heavy-docs/
tests/fixtures/duplicate-docs/
tests/fixtures/malformed-docs/
tests/fixtures/unsafe-links/
```

### 40.2 Purpose

Provide deterministic local pages for crawling and extraction tests.

### 40.3 Required Cases

- Relative and absolute links.
- Circular navigation.
- Out-of-scope links.
- Logout and destructive-looking links.
- Nested lists.
- Complex heading hierarchy.
- Tables with spans.
- Code fences containing backticks.
- Repeated navigation.
- Exact and near duplicates.
- Empty and malformed pages.
- Redirect and retry simulations where possible.

### 40.4 Completion Criteria

- Core behavior can be tested without relying on changing public websites.

---

# Part X — Cross-Module Workflows

## 41. Start Crawl Workflow

```text
Popup validates basic fields
-> Message validator validates CRAWL_CREATE
-> Configuration validator normalizes config
-> Storage creates crawl config and run
-> State machine enters PLANNING
-> Planner creates seed task
-> Scope guard approves seed URL
-> Queue persists seed task
-> State becomes READY
-> User starts
-> State becomes RUNNING
-> Orchestrator claims next task
```

## 42. Page Processing Workflow

```text
Queue claims task
-> Scope guard revalidates URL
-> Fetcher retrieves HTML
-> DOM parser creates isolated document
-> Main-content detector selects roots
-> Content extractor creates page record
-> Boilerplate detector adds evidence
-> Duplicate detector compares page
-> Quality checker scores page
-> Agent controller decides action
-> Storage atomically stores page and task result
-> Link discovery produces candidates
-> Normalizer and scope guard validate candidates
-> Queue persists accepted tasks
-> Indexer incrementally indexes accepted page
```

## 43. Failure Workflow

```text
Module returns structured failure
-> Failure record is persisted
-> Recovery manager classifies failure
-> Agent controller decides retry, skip, or stop
-> Decision event is persisted
-> Queue state is updated atomically
-> Dashboard receives replay-safe progress event
```

## 44. Finalization Workflow

```text
Queue has no runnable tasks
-> State becomes FINALIZING
-> Snapshot module creates stable snapshot
-> Archive builder orders pages
-> Markdown and JSON converters build outputs
-> Report generator builds reports
-> Archive validator checks consistency
-> State becomes COMPLETED or FAILED/PARTIAL
-> Dashboard enables exports
```

---

# Part XI — Global Completion Definition

The detailed module specification is satisfied only when:

- Every module has an implemented file matching its responsibility.
- Public interfaces are documented in source code.
- Input validation and structured errors exist.
- Pure algorithms have automated tests.
- Chrome-dependent adapters have integration or manual tests.
- State and storage invariants are verified.
- Security boundaries are tested with hostile fixtures.
- Documentation is updated when interfaces change.
- No module depends on npm, cloud AI, or an external backend.
- A full crawl can proceed through planning, safety validation, fetching, extraction, quality checking, persistence, indexing, validation, and export.

## 45. Recommended Implementation Order

```text
1. Shared contracts and configuration validator
2. Message router and service-worker shell
3. Storage adapter and schema
4. URL normalizer and scope guard
5. Crawl state machine and priority queue
6. Fetcher and link discovery
7. DOM parser and main-content detector
8. Semantic extractor
9. Markdown converter and archive builder
10. Quality, boilerplate, duplicate, and recovery modules
11. Local tokenizer, section splitter, indexer, and ranker
12. Extractive question answering
13. Dashboard completion
14. Archive validator, security review, and release hardening
```
