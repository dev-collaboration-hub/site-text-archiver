# Site Text Archiver — API, Message, and Data Contracts

## 1. Purpose

This document defines the contracts that connect every Site Text Archiver module. It specifies shared data structures, message envelopes, public module APIs, validation rules, error objects, versioning rules, pagination, idempotency, persistence boundaries, and compatibility requirements.

The system is local-first and scratch-built with plain JavaScript, HTML, CSS, Chrome Extension APIs, IndexedDB, DOMParser, Web Workers, and other browser-native capabilities. No contract in this document may require npm packages, cloud services, external AI APIs, hosted language models, backend servers, or cloud storage.

## 2. Contract Goals

Every contract must be:

1. Explicit.
2. Versioned.
3. Deterministic.
4. Validated at module boundaries.
5. Safe to persist.
6. Safe to replay when applicable.
7. Independent of UI implementation details.
8. Compatible with Manifest V3 service-worker suspension.
9. Explainable through structured errors and reason codes.
10. Stable enough for separate modules to be implemented independently.

## 3. Contract Layers

The project uses five contract layers:

```text
Shared primitive contracts
    -> Persistent entity contracts
    -> Module API contracts
    -> Runtime message contracts
    -> Export schema contracts
```

A lower layer must not depend on a higher layer. For example, a `PageRecord` may be used by the dashboard, but it must not contain dashboard-specific rendering state.

---

# Part I — Shared Contract Rules

## 4. Contract Versioning

Every persisted entity and runtime message must contain a version.

```js
{
  schemaVersion: 1
}
```

Runtime protocol messages use:

```js
{
  protocolVersion: 1
}
```

Algorithm policies use dedicated version numbers:

```js
{
  normalizationPolicyVersion: 1,
  extractionVersion: 1,
  qualityPolicyVersion: 1,
  rankingPolicyVersion: 1,
  validatorVersion: 1
}
```

### 4.1 Versioning Rules

- Adding an optional field with a safe default may keep the same major schema version.
- Removing, renaming, or changing the meaning of a required field requires a schema version increase.
- A reader must reject unsupported future major versions.
- Migrations must be explicit and testable.
- Exported files must preserve the schema version used to create them.

## 5. Required Timestamp Format

All timestamps are integers representing Unix time in milliseconds.

```text
createdAt: 1785930000000
```

Rules:

- Store timestamps in UTC.
- Never store localized date strings as authoritative values.
- UI modules may format timestamps for display.
- Deterministic tests should inject a clock rather than read the real clock directly.

## 6. Identifier Contracts

Identifiers are opaque stable strings.

```text
crawlId    crawl_<timestamp>_<random>
runId      run_<crawlId>_<sequence>
taskId     task_<crawlId>_<sequence>
pageId     page_<stable-id>
sectionId  <pageId>:section:<order>
failureId  failure_<crawlId>_<sequence>
eventId    event_<crawlId>_<sequence>
requestId  req_<timestamp>_<random>
exportId   export_<crawlId>_<sequence>
```

Rules:

- Consumers must not parse business meaning from IDs.
- IDs are case-sensitive.
- Random components use `crypto.getRandomValues()`.
- Sequence values must be persisted where deterministic ordering depends on them.

## 7. Shared Result Contract

Expected failures must be returned as structured results.

### 7.1 Success

```js
{
  ok: true,
  value: {},
  warnings: [],
  error: null,
  meta: {
    contractVersion: 1
  }
}
```

### 7.2 Failure

```js
{
  ok: false,
  value: null,
  warnings: [],
  error: {
    code: "ERROR_CODE",
    message: "Human-readable explanation",
    recoverable: false,
    stage: "VALIDATION",
    details: {}
  },
  meta: {
    contractVersion: 1
  }
}
```

### 7.3 Error Rules

- `code` is machine-readable and stable.
- `message` is safe for developers but may be simplified by the UI.
- `recoverable` indicates whether retry is meaningful.
- `stage` identifies the subsystem.
- `details` must be JSON-serializable.
- Sensitive page content must not be copied into errors without truncation and explicit debug mode.

## 8. Warning Contract

```js
{
  code: "HEADING_LEVEL_JUMP_REPAIRED",
  message: "Heading level was normalized during export.",
  stage: "EXTRACTION",
  severity: "INFO | WARNING",
  evidence: {},
  createdAt: 0
}
```

Warnings do not make a result fail. Warning order must be deterministic: severity, code, then creation sequence.

## 9. Pagination Contract

List APIs use cursor-free deterministic pagination in version 1.

### 9.1 Request

```js
{
  offset: 0,
  limit: 50,
  sort: {
    field: "createdAt",
    direction: "asc"
  },
  filters: {}
}
```

### 9.2 Response

```js
{
  items: [],
  page: {
    offset: 0,
    limit: 50,
    returned: 0,
    total: 0,
    hasMore: false
  }
}
```

Rules:

- `offset` must be a non-negative integer.
- `limit` must be bounded by a global maximum.
- Only documented sort fields are allowed.
- Equal sort values require a stable ID tie-breaker.

## 10. Sanitized Summary Contract

Large entities should not be sent to the dashboard when summaries are sufficient.

```js
{
  id: "...",
  title: "...",
  status: "...",
  warningCount: 0,
  createdAt: 0,
  updatedAt: 0
}
```

Summary contracts must be separate from full records so accidental expansion does not overload messages.

---

# Part II — Enumerations and Reason Codes

## 11. Crawl Lifecycle States

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

## 12. URL Task States

```text
DISCOVERED
QUEUED
FETCHING
FETCHED
EXTRACTING
EXTRACTED
VALIDATING
COMPLETED
SKIPPED
FAILED
CANCELLED
```

## 13. Agent Action Types

```text
FETCH_NEXT
ACCEPT_PAGE
ACCEPT_WITH_WARNING
RETRY_FETCH
RETRY_EXTRACTION
SKIP_PAGE
FAIL_PAGE
FINALIZE
STOP
CANCEL_TASK
NO_WORK
```

## 14. Failure Stages

```text
CONFIGURATION
MESSAGING
PLANNING
NORMALIZATION
SCOPE
QUEUE
FETCH
PARSE
EXTRACTION
QUALITY
RECOVERY
STORAGE
INDEXING
SEARCH
QUESTION_ANSWERING
EXPORT
VALIDATION
DOWNLOAD
RUNTIME
```

## 15. Common Reason Codes

### 15.1 URL and Scope

```text
INVALID_URL
MALFORMED_URL
UNSUPPORTED_PROTOCOL
OUTSIDE_ORIGIN
OUTSIDE_PATH
BLOCKED_EXTENSION
UNSAFE_ACTION_LINK
EXCLUDED_BY_PATTERN
NOT_INCLUDED_BY_PATTERN
MAX_DEPTH_REACHED
MAX_PAGE_LIMIT_REACHED
ALREADY_VISITED
ALREADY_QUEUED
REDIRECT_OUT_OF_SCOPE
```

### 15.2 Fetch

```text
FETCH_TIMEOUT
NETWORK_ERROR
HTTP_NOT_FOUND
HTTP_ACCESS_DENIED
HTTP_RATE_LIMITED
HTTP_SERVER_ERROR
HTTP_UNSUPPORTED_STATUS
NON_HTML_RESPONSE
HTML_SIZE_LIMIT
EMPTY_RESPONSE
```

### 15.3 Extraction and Quality

```text
HTML_PARSE_FAILED
NO_CONTENT_CANDIDATE
LOW_CONTENT_CANDIDATE
EMPTY_EXTRACTION
MALFORMED_STRUCTURE
COMPLEX_TABLE_FALLBACK
HEADING_LEVEL_JUMP_REPAIRED
HIGH_BOILERPLATE_RATIO
EXACT_DUPLICATE_CONTENT
NEAR_DUPLICATE_CONTENT
LOW_CONTENT_QUALITY
```

### 15.4 State and Queue

```text
INVALID_STATE
INVALID_TRANSITION
TERMINAL_STATE_LOCKED
STATE_VERSION_MISMATCH
DUPLICATE_TASK
QUEUE_LIMIT_REACHED
TASK_NOT_FOUND
TASK_LEASE_CONFLICT
```

### 15.5 Storage and Index

```text
DATABASE_OPEN_FAILED
TRANSACTION_FAILED
RECORD_NOT_FOUND
SCHEMA_MIGRATION_REQUIRED
SCHEMA_VERSION_UNSUPPORTED
INDEX_REFERENCE_INVALID
INDEX_UPDATE_FAILED
SNAPSHOT_CREATION_FAILED
```

### 15.6 Search, QA, and Export

```text
EMPTY_QUERY
QUERY_TOO_LONG
NO_MATCHING_PASSAGE
LOW_QUERY_COVERAGE
LOW_EVIDENCE_SCORE
INSUFFICIENT_EVIDENCE
EMPTY_ARCHIVE
EXPORT_SIZE_WARNING
ARCHIVE_VALIDATION_FAILED
DOWNLOAD_FAILED
```

---

# Part III — Persistent Data Contracts

## 16. CrawlConfig

```js
{
  schemaVersion: 1,
  crawlId: "crawl_...",
  startUrl: "https://example.com/docs",
  allowedOrigin: "https://example.com",
  allowedPathPrefix: "/docs",
  maxPages: 200,
  maxDepth: 8,
  requestDelayMs: 500,
  retryLimit: 2,
  fetchTimeoutMs: 15000,
  maxHtmlBytes: 5000000,
  includePatterns: [],
  excludePatterns: [],
  blockedExtensions: ["pdf", "zip", "png"],
  trackingParameterPolicy: {
    removeDefaults: true,
    explicitRemove: [],
    explicitKeep: []
  },
  trailingSlashMode: "REMOVE_EXCEPT_ROOT",
  exportOptions: {
    markdown: true,
    json: true,
    crawlReport: true,
    failedPagesReport: true
  },
  createdAt: 0,
  updatedAt: 0
}
```

### 16.1 Validation

- `startUrl` must be HTTP or HTTPS.
- `allowedOrigin` must be a valid origin.
- `allowedPathPrefix` must begin with `/`.
- Numeric limits must be integers inside safety bounds.
- Patterns must be bounded strings.
- Blocked extensions are lowercase without leading dots.
- `crawlId` must be unique.

## 17. CrawlRun

```js
{
  schemaVersion: 1,
  runId: "run_...",
  crawlId: "crawl_...",
  lifecycle: "RUNNING",
  stateVersion: 12,
  cancelRequested: false,
  pauseRequested: false,
  activeTaskId: null,
  nextTaskSequence: 1,
  nextDiscoverySequence: 1,
  nextEventSequence: 1,
  counts: {
    discovered: 0,
    queued: 0,
    fetching: 0,
    completed: 0,
    skipped: 0,
    failed: 0
  },
  limits: {
    acceptedPages: 0,
    reservedTasks: 0
  },
  startedAt: null,
  pausedAt: null,
  completedAt: null,
  createdAt: 0,
  updatedAt: 0
}
```

### 17.1 Invariants

- `stateVersion` increases on every persisted state transition.
- Only one active task exists in the initial sequential crawler.
- `completedAt` exists only in a terminal state.
- Count changes must be transactionally consistent with task changes.

## 18. UrlRecord

```js
{
  schemaVersion: 1,
  taskId: "task_...",
  crawlId: "crawl_...",
  rawUrl: "../guide",
  canonicalUrl: "https://example.com/docs/guide",
  discoveredFrom: "https://example.com/docs",
  linkLabel: "Guide",
  placement: "NAVIGATION | HEADING | BODY | SIDEBAR | UNKNOWN",
  depth: 1,
  state: "QUEUED",
  priorityScore: 40,
  priorityEvidence: {},
  discoverySequence: 1,
  attempts: 0,
  finalUrl: null,
  reasonCode: null,
  lease: null,
  discoveredAt: 0,
  updatedAt: 0
}
```

### 18.1 Lease Contract

```js
{
  ownerId: "runtime-instance-id",
  operationId: "operation-id",
  acquiredAt: 0,
  expiresAt: 0
}
```

A lease prevents duplicate processing after concurrent wake-ups.

## 19. FetchRecord

```js
{
  schemaVersion: 1,
  taskId: "task_...",
  requestedUrl: "...",
  finalUrl: "...",
  status: 200,
  contentType: "text/html; charset=utf-8",
  htmlByteLength: 12345,
  redirectCount: 0,
  responseHeaders: {
    etag: null,
    lastModified: null,
    retryAfter: null
  },
  fetchedAt: 0,
  durationMs: 0
}
```

Raw HTML is not required as a long-term persisted field. Debug persistence must be optional, bounded, and disabled by default.

## 20. PageRecord

```js
{
  schemaVersion: 1,
  extractionVersion: 1,
  pageId: "page_...",
  crawlId: "crawl_...",
  taskId: "task_...",
  url: "https://example.com/docs/guide",
  canonicalUrl: "https://example.com/docs/guide",
  title: "Guide",
  language: null,
  metadata: {
    description: null,
    canonicalLink: null,
    author: null
  },
  headings: [],
  blocks: [],
  links: [],
  plainText: "...",
  markdown: "...",
  contentHash: "sha256...",
  structureHash: "...",
  quality: {
    score: 0,
    band: "STRONG | ACCEPTABLE | WEAK | FAILED",
    dimensions: {},
    warnings: [],
    policyVersion: 1
  },
  duplicate: {
    exactDuplicateOf: null,
    nearDuplicateOf: null,
    similarity: 0
  },
  boilerplateRatio: 0,
  depth: 0,
  discoverySequence: 0,
  navigationSequence: null,
  fetchedAt: 0,
  extractedAt: 0,
  createdAt: 0,
  updatedAt: 0
}
```

### 20.1 PageRecord Rules

- `blocks` are the authoritative semantic extraction.
- `plainText` and `markdown` are derived outputs.
- Raw untrusted HTML must not appear in the record.
- `canonicalUrl` must pass scope validation.
- The record is stored before the task becomes `COMPLETED`.

## 21. SemanticBlock

All blocks share:

```js
{
  blockId: "<pageId>:block:<order>",
  type: "paragraph",
  order: 0,
  headingPath: [],
  text: "...",
  warnings: []
}
```

### 21.1 HeadingBlock

```js
{
  type: "heading",
  originalLevel: 2,
  normalizedLevel: 2,
  text: "Installation",
  headingPath: ["Guide", "Installation"]
}
```

### 21.2 ParagraphBlock

```js
{
  type: "paragraph",
  text: "Install the extension...",
  inline: [
    { type: "text", text: "Install " },
    { type: "code", text: "manifest.json" },
    { type: "link", text: "documentation", url: "..." }
  ]
}
```

### 21.3 CodeBlock

```js
{
  type: "code-block",
  language: "javascript",
  code: "console.log('hello');",
  text: "console.log('hello');"
}
```

### 21.4 ListBlock

```js
{
  type: "ordered-list | unordered-list",
  items: [
    {
      text: "Item",
      inline: [],
      children: []
    }
  ]
}
```

### 21.5 TableBlock

```js
{
  type: "table",
  caption: "Options",
  headers: ["Name", "Meaning"],
  rows: [["maxDepth", "Maximum crawl depth"]],
  warnings: []
}
```

## 22. SectionRecord

```js
{
  schemaVersion: 1,
  sectionId: "page_x:section:0",
  pageId: "page_x",
  crawlId: "crawl_x",
  order: 0,
  headingPath: ["Guide", "Installation"],
  headingText: "Installation",
  text: "...",
  markdown: "...",
  tokenCount: 100,
  sourceUrl: "...",
  startBlockOrder: 3,
  endBlockOrder: 8,
  createdAt: 0
}
```

## 23. FailureRecord

```js
{
  schemaVersion: 1,
  failureId: "failure_...",
  crawlId: "crawl_...",
  taskId: "task_...",
  url: "...",
  stage: "FETCH",
  code: "FETCH_TIMEOUT",
  message: "Page request timed out.",
  recoverable: true,
  attempt: 1,
  details: {},
  createdAt: 0
}
```

## 24. AgentEvent

```js
{
  schemaVersion: 1,
  eventId: "event_...",
  crawlId: "crawl_...",
  taskId: null,
  sequence: 1,
  type: "PAGE_ACCEPTED",
  action: "ACCEPT_PAGE",
  reasonCode: "QUALITY_ACCEPTABLE",
  evidence: {},
  stateVersion: 12,
  createdAt: 0
}
```

Events are append-only and replay-safe.

## 25. IndexTermRecord

```js
{
  schemaVersion: 1,
  crawlId: "crawl_...",
  term: "indexeddb",
  documentFrequency: 12,
  sectionFrequency: 15,
  updatedAt: 0
}
```

## 26. IndexPostingRecord

```js
{
  schemaVersion: 1,
  postingId: "<crawlId>:<term>:<sectionId>",
  crawlId: "crawl_...",
  term: "indexeddb",
  sectionId: "page_x:section:2",
  pageId: "page_x",
  headingFrequency: 1,
  bodyFrequency: 3,
  positions: [4, 19, 42]
}
```

## 27. SearchResult

```js
{
  sectionId: "...",
  pageId: "...",
  pageTitle: "...",
  headingPath: [],
  sourceUrl: "...",
  snippet: "...",
  score: 4.52,
  evidence: {
    matchedTerms: [],
    phraseMatched: false,
    headingMatched: false,
    coverage: 0
  }
}
```

## 28. QuestionAnswerResult

```js
{
  schemaVersion: 1,
  answerType: "EXTRACTIVE | INSUFFICIENT_EVIDENCE",
  question: "What files are required?",
  passages: [
    {
      text: "...",
      sectionId: "...",
      pageId: "...",
      pageTitle: "...",
      headingPath: [],
      sourceUrl: "...",
      score: 0
    }
  ],
  confidence: {
    level: "HIGH | MEDIUM | INSUFFICIENT",
    reason: "STRONG_PASSAGE_MATCH",
    evidence: {}
  },
  rankingPolicyVersion: 1,
  createdAt: 0
}
```

## 29. ArchiveSnapshot

```js
{
  schemaVersion: 1,
  snapshotId: "snapshot_...",
  crawlId: "crawl_...",
  stateVersion: 20,
  lifecycle: "COMPLETED",
  pageIds: [],
  sectionIds: [],
  failureIds: [],
  createdAt: 0
}
```

The snapshot freezes the set of records used for deterministic export. Export generation must not read a moving active crawl state.

## 30. ExportRecord

```js
{
  schemaVersion: 1,
  exportId: "export_...",
  crawlId: "crawl_...",
  snapshotId: "snapshot_...",
  type: "MARKDOWN | JSON | CRAWL_REPORT | FAILED_PAGES",
  fileName: "documentation.md",
  mimeType: "text/markdown",
  byteLength: 0,
  contentHash: "...",
  validationStatus: "VALID | WARNING | INVALID",
  createdAt: 0
}
```

---

# Part IV — Runtime Message Protocol

## 31. Message Envelope

### 31.1 Request

```js
{
  protocolVersion: 1,
  type: "CRAWL_START",
  requestId: "req_...",
  crawlId: "crawl_...",
  sender: "POPUP | DASHBOARD | SERVICE_WORKER | WORKER | OFFSCREEN",
  payload: {},
  timestamp: 0
}
```

### 31.2 Response

```js
{
  protocolVersion: 1,
  type: "CRAWL_START_RESULT",
  requestId: "req_...",
  crawlId: "crawl_...",
  ok: true,
  payload: {},
  warnings: [],
  error: null,
  timestamp: 0
}
```

### 31.3 Event

```js
{
  protocolVersion: 1,
  type: "CRAWL_PROGRESS_EVENT",
  eventId: "event_...",
  crawlId: "crawl_...",
  sequence: 1,
  payload: {},
  timestamp: 0
}
```

## 32. Envelope Validation

All messages require:

- Supported `protocolVersion`.
- Known `type`.
- Valid sender.
- Integer timestamp.
- JSON-serializable payload.

Requests require a unique `requestId`.

Responses must preserve the exact request ID.

Events require `eventId`, `crawlId`, and deterministic sequence.

Unknown fields may be ignored only when the protocol version explicitly permits extension fields.

## 33. Idempotency Contract

Commands that change state must be idempotent by `requestId`.

```text
CRAWL_CREATE
CRAWL_START
CRAWL_PAUSE
CRAWL_RESUME
CRAWL_CANCEL
EXPORT_CREATE
```

The runtime stores a bounded request-result cache:

```js
{
  requestId: "req_...",
  messageType: "CRAWL_START",
  response: {},
  createdAt: 0,
  expiresAt: 0
}
```

If an identical request ID is replayed, the previous result is returned without repeating side effects. A reused request ID with a different message type or payload is rejected.

## 34. Command Messages

### 34.1 CRAWL_CREATE

Request payload:

```js
{
  config: {
    startUrl: "...",
    allowedOrigin: "...",
    allowedPathPrefix: "/docs",
    maxPages: 200,
    maxDepth: 8,
    requestDelayMs: 500,
    retryLimit: 2,
    includePatterns: [],
    excludePatterns: []
  }
}
```

Success payload:

```js
{
  crawlId: "crawl_...",
  lifecycle: "PLANNING",
  config: {}
}
```

### 34.2 CRAWL_START

Request:

```js
{
  crawlId: "crawl_..."
}
```

Success:

```js
{
  lifecycle: "RUNNING",
  stateVersion: 1
}
```

### 34.3 CRAWL_PAUSE

Success means the pause request was persisted, not necessarily that the active operation has already stopped.

```js
{
  lifecycle: "PAUSING",
  pauseRequested: true
}
```

A later event announces `PAUSED` after a safe point.

### 34.4 CRAWL_RESUME

```js
{
  lifecycle: "RUNNING",
  stateVersion: 0
}
```

### 34.5 CRAWL_CANCEL

```js
{
  lifecycle: "CANCELLED | RUNNING",
  cancelRequested: true,
  immediate: false
}
```

Cancellation is cooperative for active bounded work.

## 35. Query Messages

### 35.1 GET_CRAWL_SUMMARY

Request:

```js
{
  crawlId: "crawl_..."
}
```

Response:

```js
{
  crawlId: "crawl_...",
  lifecycle: "RUNNING",
  stateVersion: 4,
  counts: {},
  currentTask: null,
  recentWarningCount: 0,
  createdAt: 0,
  updatedAt: 0
}
```

### 35.2 GET_PAGE_LIST

```js
{
  crawlId: "crawl_...",
  pagination: {
    offset: 0,
    limit: 50,
    sort: { "field": "discoverySequence", "direction": "asc" },
    filters: {
      qualityBand: null,
      hasWarnings: null
    }
  }
}
```

Returns `PageSummary[]` rather than complete page content.

### 35.3 GET_PAGE_DETAIL

```js
{
  crawlId: "crawl_...",
  pageId: "page_..."
}
```

Large fields may be selectively requested:

```js
{
  include: ["metadata", "blocks", "quality", "links"]
}
```

### 35.4 GET_FAILURE_LIST

Supports filters for stage, code, recoverability, and task state.

### 35.5 GET_AGENT_EVENTS

Events are sorted by sequence ascending and can be paginated.

## 36. Search Message

### 36.1 SEARCH_ARCHIVE

Request:

```js
{
  crawlId: "crawl_...",
  query: "manifest v3 permissions",
  limit: 10,
  filters: {
    pageIds: [],
    sourcePrefix: null
  }
}
```

Success:

```js
{
  query: "manifest v3 permissions",
  results: [],
  totalCandidates: 0,
  rankingPolicyVersion: 1
}
```

Validation:

- Query must not be empty after tokenization.
- Query length is bounded.
- Limit is bounded.
- Search operates only on the requested crawl index.

## 37. Question-Answering Message

### 37.1 ASK_ARCHIVE

Request:

```js
{
  crawlId: "crawl_...",
  question: "What files are required for installation?",
  maximumPassages: 3
}
```

Response follows `QuestionAnswerResult`.

The answer engine must return `INSUFFICIENT_EVIDENCE` rather than inventing missing content.

## 38. Export Messages

### 38.1 EXPORT_CREATE

```js
{
  crawlId: "crawl_...",
  snapshotMode: "LATEST_STABLE | CREATE_NEW",
  formats: ["MARKDOWN", "JSON", "CRAWL_REPORT"]
}
```

Response:

```js
{
  exportJobId: "export_job_...",
  snapshotId: "snapshot_...",
  status: "QUEUED"
}
```

### 38.2 EXPORT_STATUS

```js
{
  exportJobId: "export_job_..."
}
```

Response:

```js
{
  status: "QUEUED | BUILDING | VALIDATING | READY | FAILED",
  progress: {
    completedSteps: 0,
    totalSteps: 0
  },
  exports: []
}
```

### 38.3 EXPORT_DOWNLOAD

```js
{
  exportId: "export_..."
}
```

The download adapter validates the export record before invoking the browser download API.

## 39. Progress Events

Recommended event types:

```text
CRAWL_CREATED
CRAWL_PLANNED
CRAWL_STARTED
CRAWL_PAUSING
CRAWL_PAUSED
CRAWL_RESUMED
CRAWL_CANCELLED
TASK_DISCOVERED
TASK_QUEUED
TASK_FETCHING
TASK_RETRY_SCHEDULED
PAGE_EXTRACTED
PAGE_ACCEPTED
PAGE_SKIPPED
PAGE_FAILED
INDEX_UPDATED
FINALIZATION_STARTED
ARCHIVE_VALIDATED
CRAWL_COMPLETED
CRAWL_FAILED
EXPORT_READY
```

### 39.1 Progress Event Payload

```js
{
  lifecycle: "RUNNING",
  stateVersion: 10,
  counts: {},
  task: {
    taskId: "...",
    canonicalUrl: "...",
    state: "FETCHING"
  },
  decision: {
    action: "FETCH_NEXT",
    reasonCode: "URL_ALLOWED"
  }
}
```

Events must remain compact. Detailed records are retrieved through query messages.

---

# Part V — Public Module API Contracts

## 40. URL Normalizer API

```js
normalizeUrl(rawUrl, parentUrl, policy) -> Result<NormalizedUrl>
```

```js
normalizePath(pathname, trailingSlashMode) -> string
```

```js
isTrackingParameter(key, policy) -> boolean
```

`NormalizedUrl`:

```js
{
  canonicalUrl: "...",
  displayUrl: "...",
  transformations: [],
  removedParameters: [],
  warnings: []
}
```

## 41. Scope Guard API

```js
evaluateScope(candidate, config, duplicateContext) -> ScopeDecision
```

```js
pathIsInside(candidatePath, allowedPathPrefix) -> boolean
```

```js
detectUnsafeAction(url, optionalLabel) -> UnsafeActionDecision
```

`ScopeDecision`:

```js
{
  allowed: true,
  reasonCode: "URL_ALLOWED",
  evidence: {}
}
```

## 42. Priority Queue API

```js
createQueue(maxSize) -> Queue
queue.enqueue(task) -> Result<Task>
queue.dequeue() -> Result<Task | null>
queue.peek() -> Task | null
queue.hasUrl(canonicalUrl) -> boolean
queue.remove(taskId) -> Result<Task>
queue.size() -> number
queue.serialize() -> object
restoreQueue(serialized) -> Result<Queue>
```

The queue comparator is injected or imported from one versioned policy module.

## 43. State Machine API

```js
canTransition(currentState, eventType) -> boolean
transitionCrawl(currentState, event, transitionTable) -> Result<StateTransition>
isTerminal(state) -> boolean
```

`StateTransition`:

```js
{
  previousState: "RUNNING",
  nextState: "PAUSING",
  eventType: "PAUSE",
  changedAt: 0
}
```

## 44. Fetcher API

```js
fetchPage(task, config, adapters) -> Promise<Result<FetchPayload>>
classifyHttpStatus(status, headers) -> HttpClassification
```

`FetchPayload`:

```js
{
  requestedUrl: "...",
  finalUrl: "...",
  status: 200,
  contentType: "text/html",
  html: "...",
  fetchedAt: 0,
  durationMs: 0
}
```

The HTML field is runtime-only and should be released after extraction.

## 45. DOM Parser API

```js
parseHtml(html, baseUrl) -> Result<Document>
cleanDocument(document, cleanupPolicy) -> Result<CleanDocument>
```

The returned document is untrusted analysis input and must never be rendered directly.

## 46. Extractor API

```js
selectMainContentRoot(document, policy, boilerplateModel) -> Result<ContentRootSelection>
extractSemanticBlocks(root, pageUrl, policy) -> Result<SemanticBlock[]>
extractPage(fetchPayload, extractionContext) -> Promise<Result<PageDraft>>
```

`PageDraft` excludes final IDs and persisted timestamps until validated.

## 47. Duplicate Detector API

```js
computeContentHash(text) -> Promise<string>
buildShingleSet(tokens, width, maxShingles) -> Set<string>
jaccardSimilarity(setA, setB) -> number
findDuplicate(pageDraft, duplicateIndex, policy) -> DuplicateDecision
```

## 48. Boilerplate Detector API

```js
updateBoilerplateModel(pageBlocks, model) -> BoilerplateModel
classifyBoilerplate(blockFingerprint, model, policy) -> BoilerplateClassification
estimateBoilerplateRatio(blocks, model, policy) -> number
```

## 49. Quality Checker API

```js
evaluatePageQuality(pageDraft, evidence, policy) -> QualityResult
```

`QualityResult`:

```js
{
  score: 82,
  band: "ACCEPTABLE",
  dimensions: {},
  warnings: [],
  policyVersion: 1
}
```

## 50. Recovery Manager API

```js
decideRecovery(task, result, context) -> AgentDecision
calculateRetryDelay(attempt, error, policy) -> number
```

`AgentDecision`:

```js
{
  action: "RETRY_FETCH",
  reasonCode: "RECOVERABLE_FAILURE",
  evidence: {},
  statePatch: {},
  tasksToAdd: []
}
```

## 51. Storage API

The storage layer exposes domain methods rather than raw IndexedDB calls.

```js
openDatabase() -> Promise<Result<DatabaseHandle>>
runTransaction(storeNames, mode, callback) -> Promise<Result<unknown>>
```

Domain methods:

```js
createCrawlConfig(config)
getCrawlConfig(crawlId)
createCrawlRun(run)
getCrawlRun(crawlId)
updateCrawlRun(crawlId, expectedStateVersion, patch)
putUrlRecord(record)
getUrlRecord(taskId)
listUrlRecords(crawlId, pagination)
putPageRecord(record)
getPageRecord(pageId)
listPageSummaries(crawlId, pagination)
putSectionRecords(records)
putFailureRecord(record)
appendAgentEvent(event)
listAgentEvents(crawlId, pagination)
createArchiveSnapshot(crawlId)
```

### 51.1 Optimistic Concurrency

`updateCrawlRun` requires `expectedStateVersion`.

If the stored version differs, return:

```text
STATE_VERSION_MISMATCH
```

This prevents stale runtime instances from overwriting newer state.

## 52. Indexer API

```js
splitPageIntoSections(pageRecord) -> SectionRecord[]
indexSection(section, indexWriter, policy) -> Promise<Result<IndexUpdateSummary>>
removePageFromIndex(pageId) -> Promise<Result<IndexUpdateSummary>>
finalizeIndex(crawlId) -> Promise<Result<IndexSummary>>
```

## 53. Search API

```js
searchIndex(query, crawlId, policy, filters) -> Promise<Result<SearchResponse>>
```

```js
selectSnippet(sectionText, queryTokens, maximumCharacters) -> string
```

## 54. Question Answering API

```js
answerQuestion(question, crawlId, policy) -> Promise<Result<QuestionAnswerResult>>
```

Internal APIs:

```js
buildPassages(section, policy)
rankAnswerPassages(question, candidateSections, policy)
classifyAnswerConfidence(questionEvidence, rankedPassages, policy)
```

## 55. Archive Builder API

```js
buildMarkdownArchive(snapshot, policy) -> Promise<Result<GeneratedExport>>
buildJsonArchive(snapshot, policy) -> Promise<Result<GeneratedExport>>
buildCrawlReport(snapshot, policy) -> Promise<Result<GeneratedExport>>
```

`GeneratedExport`:

```js
{
  type: "MARKDOWN",
  fileName: "documentation.md",
  mimeType: "text/markdown",
  content: "...",
  byteLength: 0,
  contentHash: "..."
}
```

## 56. Archive Validator API

```js
validateArchive(snapshot, generatedExports, indexSummary, policy) -> Result<ValidationReport>
```

`ValidationReport`:

```js
{
  valid: true,
  errors: [],
  warnings: [],
  validatorVersion: 1,
  validatedAt: 0
}
```

## 57. Download Adapter API

```js
downloadExport(exportRecord, contentOrBlob) -> Promise<Result<DownloadResult>>
```

```js
{
  downloadId: 123,
  fileName: "documentation.md",
  startedAt: 0
}
```

---

# Part VI — IndexedDB Contract

## 58. Database Identity

```text
Database name: site-text-archiver
Initial database version: 1
```

## 59. Object Stores

```text
crawlConfigs
crawlRuns
urlRecords
pageRecords
sectionRecords
failureRecords
agentEvents
indexTerms
indexPostings
archiveSnapshots
exportRecords
requestResults
```

## 60. Primary Keys

```text
crawlConfigs      crawlId
crawlRuns         crawlId
urlRecords        taskId
pageRecords       pageId
sectionRecords    sectionId
failureRecords    failureId
agentEvents       eventId
indexTerms        [crawlId, term]
indexPostings     postingId
archiveSnapshots  snapshotId
exportRecords     exportId
requestResults    requestId
```

## 61. Required Indexes

### urlRecords

```text
byCrawlId
byCrawlAndState
byCrawlAndCanonicalUrl unique within crawl
byCrawlAndPriority
```

### pageRecords

```text
byCrawlId
byCrawlAndCanonicalUrl unique within accepted non-alias pages
byCrawlAndDiscoverySequence
byCrawlAndQualityBand
byContentHash
```

### sectionRecords

```text
byCrawlId
byPageId
byPageAndOrder unique
```

### failureRecords

```text
byCrawlId
byTaskId
byCrawlAndStage
byCrawlAndCode
```

### agentEvents

```text
byCrawlAndSequence unique
byTaskId
byType
```

### indexPostings

```text
byCrawlAndTerm
bySectionId
byPageId
```

## 62. Transaction Boundaries

### 62.1 Accept Page Transaction

The following should succeed or fail together:

1. Insert or replace `PageRecord`.
2. Insert `SectionRecord[]`.
3. Update task state to `COMPLETED`.
4. Update crawl counts.
5. Append `PAGE_ACCEPTED` event.

Index postings may be committed in a following bounded transaction, but the page must expose an `indexStatus` until indexing succeeds.

### 62.2 Failure Transaction

1. Insert `FailureRecord`.
2. Update task state.
3. Update crawl counts.
4. Append failure or retry event.

### 62.3 State Transition Transaction

1. Verify expected state version.
2. Verify transition.
3. Update lifecycle and state version.
4. Append lifecycle event.

## 63. Migration Contract

Each migration defines:

```js
{
  fromVersion: 1,
  toVersion: 2,
  description: "Add export records store",
  migrate(database, transaction) {}
}
```

Migration tests must cover:

- Fresh database creation.
- Upgrade from every supported prior version.
- Failed migration behavior.
- Preservation of existing accepted pages.

---

# Part VII — Export Schemas

## 64. Markdown Archive Contract

Required top-level structure:

```markdown
# Documentation Archive

- Source root
- Crawl timestamp
- Page count
- Warning count

## Table of Contents

...

## Page Title

Source: https://example.com/docs/page

...
```

Rules:

- Every page includes its source URL.
- Page order follows stable archive ordering.
- Code fences safely exceed internal backtick runs.
- Heading levels are normalized.
- Raw HTML is not included unless explicitly supported and sanitized in a future version.

## 65. JSON Archive Contract

```js
{
  schemaVersion: 1,
  generator: {
    name: "Site Text Archiver",
    version: "0.1.0"
  },
  crawl: {
    crawlId: "...",
    startUrl: "...",
    allowedOrigin: "...",
    allowedPathPrefix: "...",
    lifecycle: "COMPLETED",
    createdAt: 0,
    completedAt: 0
  },
  summary: {
    pages: 0,
    sections: 0,
    failures: 0,
    skipped: 0,
    warnings: 0
  },
  pages: [],
  failures: [],
  validation: {}
}
```

Unknown internal fields must not automatically leak into exports. Export schemas are allowlists.

## 66. Crawl Report Contract

```js
{
  schemaVersion: 1,
  crawlId: "...",
  configurationSummary: {},
  lifecycle: "COMPLETED",
  counts: {},
  timing: {
    createdAt: 0,
    startedAt: 0,
    completedAt: 0,
    durationMs: 0
  },
  decisions: {
    reasonCodeCounts: {}
  },
  quality: {
    averageScore: 0,
    bandCounts: {},
    warningCodeCounts: {}
  },
  failures: [],
  skipped: [],
  validation: {}
}
```

---

# Part VIII — Validation Rules

## 67. Validation Strategy

Validation happens at four boundaries:

1. UI input before sending a message.
2. Runtime message router before invoking business logic.
3. Public module API before processing.
4. Persistence adapter before committing records.

UI validation improves usability but is never trusted as the only validation.

## 68. Primitive Validators

Required validators:

```js
isNonEmptyString(value, maxLength)
isIntegerInRange(value, min, max)
isSupportedHttpUrl(value)
isValidOrigin(value)
isValidPathPrefix(value)
isKnownEnum(value, allowedValues)
isSafeJsonObject(value, depthLimit, keyLimit)
isTimestamp(value)
isIdentifier(value, prefix)
```

## 69. Object Validation Result

```js
{
  valid: false,
  errors: [
    {
      path: "payload.config.maxPages",
      code: "OUT_OF_RANGE",
      message: "maxPages must be between 1 and 5000"
    }
  ]
}
```

Validation errors are sorted by path then code.

## 70. Payload Size Limits

Every message type must have a maximum serialized payload size.

Guidelines:

- Commands and summaries remain small.
- Full extracted page content is retrieved only when explicitly requested.
- Raw HTML is never sent to popup or dashboard.
- Large exports are passed using `Blob`, object URLs, or storage references rather than copied repeatedly through runtime messages.

## 71. Content Safety Rules

- Page titles, labels, headings, passages, and URLs are untrusted strings.
- Dashboard rendering uses `textContent`.
- Links are created only after protocol validation.
- Archived content must not contain active script nodes.
- Export file names are normalized and cannot contain path separators.
- Error details are escaped or rendered as text.

---

# Part IX — Compatibility and Deprecation

## 72. Backward Compatibility

A newer module may read an older compatible record by applying documented defaults.

Example:

```text
Missing optional quality.band -> derive from quality.score
```

A module must not silently reinterpret a field whose meaning changed.

## 73. Message Deprecation

Deprecated messages remain supported for at least one protocol version when practical.

A deprecated response may include:

```js
{
  warnings: [
    {
      code: "MESSAGE_TYPE_DEPRECATED",
      message: "Use GET_CRAWL_SUMMARY instead."
    }
  ]
}
```

## 74. Unsupported Version Response

```js
{
  ok: false,
  error: {
    code: "PROTOCOL_VERSION_UNSUPPORTED",
    message: "Protocol version 3 is not supported.",
    recoverable: false,
    stage: "MESSAGING",
    details: {
      supportedVersions: [1]
    }
  }
}
```

---

# Part X — Example End-to-End Contract Flow

## 75. Create and Start Crawl

```text
Popup validates form
    -> sends CRAWL_CREATE
Service worker validates envelope and payload
    -> stores CrawlConfig and CrawlRun
    -> returns crawlId
Popup sends CRAWL_START
Service worker validates state transition
    -> persists RUNNING state
    -> emits CRAWL_STARTED
```

## 76. Process One Page

```text
Queue returns UrlRecord
    -> runtime stores FETCHING state
Fetcher returns FetchPayload
    -> parser returns Document
Extractor returns PageDraft
Duplicate detector returns duplicate evidence
Quality checker returns QualityResult
Agent controller returns AgentDecision
Storage transaction writes PageRecord, sections, task state, count, event
Indexer writes postings
Runtime emits PAGE_ACCEPTED and INDEX_UPDATED
```

## 77. Search

```text
Dashboard sends SEARCH_ARCHIVE
Message router validates query
Search module reads index terms and postings
Search returns ranked SearchResult[]
Dashboard renders text and safe source links
```

## 78. Ask Question

```text
Dashboard sends ASK_ARCHIVE
QA module performs local search
Candidate sections become bounded passages
Passages are ranked
Confidence classifier checks evidence
Response returns extracts and source URLs
Unsupported question returns INSUFFICIENT_EVIDENCE
```

## 79. Export

```text
Dashboard sends EXPORT_CREATE
Runtime creates immutable ArchiveSnapshot
Archive builder creates Markdown and JSON
Validator checks generated exports
ExportRecord is stored
Runtime emits EXPORT_READY
Dashboard requests EXPORT_DOWNLOAD
Download adapter starts browser download
```

---

# Part XI — Contract Test Requirements

## 80. Shared Contract Tests

- Success and failure result shapes.
- Warning ordering.
- Identifier validation.
- Timestamp validation.
- Unsupported versions.
- JSON serialization safety.

## 81. Entity Tests

- Required fields.
- Boundary values.
- Unknown enum values.
- Duplicate keys.
- State-version conflicts.
- Invalid cross-record references.

## 82. Message Tests

- Every known request type.
- Missing request ID.
- Unknown message type.
- Unsupported protocol version.
- Invalid sender.
- Oversized payload.
- Idempotent replay.
- Request ID reused with altered payload.
- Correct response correlation.

## 83. Storage Contract Tests

- Fresh database creation.
- Atomic page acceptance.
- Failed transaction rollback.
- Optimistic concurrency conflict.
- Deterministic pagination.
- Migration success and failure.

## 84. API Tests

- Valid and invalid inputs for every public API.
- Structured expected failures instead of uncontrolled exceptions.
- Deterministic output ordering.
- Cancellation and timeout boundaries.
- No mutation of caller-owned input objects unless explicitly documented.

## 85. Export Contract Tests

- Stable output for unchanged snapshots.
- Allowlisted JSON fields only.
- Source URL on every page.
- Closed code fences.
- Valid references.
- Correct schema version.

---

# Part XII — Completion Criteria

This contract document is complete only when implementation satisfies all of the following:

1. Shared entities have matching source definitions and validators.
2. Every runtime message type has a payload validator and handler registration.
3. Every response preserves request correlation.
4. State-changing commands are idempotent.
5. IndexedDB stores and indexes match the documented schema.
6. Public module APIs return structured results.
7. Persistent state uses optimistic concurrency where stale writes are possible.
8. Dashboard queries use summaries and pagination rather than loading entire archives.
9. Search and question-answering responses cite existing local records.
10. Export schemas are explicit allowlists.
11. Contract tests cover normal, boundary, invalid, replay, and migration behavior.
12. No contract requires npm, cloud services, backend infrastructure, or hosted AI.

## 86. Recommended Source Files

```text
src/shared/contracts.js
src/shared/enums.js
src/shared/reason-codes.js
src/shared/result.js
src/shared/identifiers.js
src/shared/validators.js
src/shared/schema-versions.js

src/messaging/message-types.js
src/messaging/message-contracts.js
src/messaging/message-validator.js
src/messaging/message-router.js
src/messaging/idempotency-store.js
src/messaging/event-publisher.js

src/storage/database-schema.js
src/storage/migrations.js
src/storage/repositories/*.js

src/export/export-schemas.js
```

These files should contain executable definitions aligned with this document rather than copying large documentation-only objects into runtime memory.
