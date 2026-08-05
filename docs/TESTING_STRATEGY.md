# Site Text Archiver — Testing Strategy, Fixtures, and Test Cases

## 1. Purpose

This document defines how Site Text Archiver will be verified from individual pure functions through complete Chrome-extension workflows.

The current testing scope covers:

- Functional correctness
- Deterministic behavior
- Crawl limits and scope behavior
- Content extraction quality
- Storage consistency
- Search and extractive question answering
- Service-worker restart recovery
- Performance and bounded resource usage
- Accessibility and usability
- Release acceptance

The project uses no npm test framework. Tests are built with browser-native JavaScript, local HTML fixtures, deterministic mocks, real IndexedDB integration pages, and a small project-owned test harness.

## 2. Testing Objectives

Testing must prove that the extension is:

1. Functionally correct.
2. Deterministic for unchanged inputs.
3. Restricted to the configured crawl origin and path.
4. Resumable after Manifest V3 service-worker suspension.
5. Capable of preserving documentation structure.
6. Bounded in retries, memory, queue size, page count, and processing time.
7. Fully local for extraction, indexing, search, and question answering.
8. Explainable through errors, warnings, evidence, and reason codes.
9. Responsive for realistic documentation archives.
10. Usable by a non-developer in the final release.

## 3. Test Levels

```text
L1 — Pure unit tests
L2 — Module contract tests
L3 — Storage and adapter integration tests
L4 — Pipeline integration tests
L5 — Chrome extension end-to-end tests
L6 — Reliability and performance tests
L7 — Manual release acceptance tests
```

### 3.1 Pure Unit Tests

Used for algorithms that do not require Chrome APIs or IndexedDB:

- URL normalization
- Scope validation
- Link filtering
- Priority scoring
- Heap ordering
- State transitions
- Main-content scoring
- Markdown generation
- Duplicate detection
- Quality scoring
- Tokenization
- Search ranking
- Passage ranking
- Archive validation

### 3.2 Module Contract Tests

Verify that public module functions:

- Accept documented input structures.
- Reject malformed input.
- Return the shared result contract.
- Use documented error codes.
- Do not mutate input unexpectedly.
- Produce stable output ordering.

### 3.3 Integration Tests

Verify boundaries such as:

- Message router to runtime controller
- Crawler to fetch adapter
- Extractor to quality checker
- Page storage to section storage
- Section storage to local index
- Archive builder to validator
- Dashboard queries to pagination adapters

### 3.4 Pipeline Tests

Run complete deterministic pipelines against local fixtures:

```text
HTML fixture
-> parse
-> clean DOM
-> select content root
-> extract semantic blocks
-> score quality
-> store page
-> build sections
-> index
-> search
-> question answering
-> export
-> validate
```

### 3.5 End-to-End Tests

Load the extension through Chrome developer mode and verify real user flows against a local fixture website.

### 3.6 Reliability and Performance Tests

Test interruption, corrupted state, oversized pages, queue pressure, duplicate pages, repeated content, large indexes, and large exports.

### 3.7 Manual Release Acceptance

A human performs the complete installation and usage flow without needing developer tools for normal operation.

---

## 4. Scratch Test Harness

### 4.1 Repository Structure

```text
tests/
├── index.html
├── test-runner.js
├── test-api.js
├── assertions.js
├── reporters/
│   ├── console-reporter.js
│   └── html-reporter.js
├── mocks/
│   ├── chrome-runtime-mock.js
│   ├── storage-mock.js
│   ├── fetch-mock.js
│   ├── clock-mock.js
│   └── download-mock.js
├── fixtures/
│   ├── html/
│   ├── crawl-sites/
│   ├── records/
│   ├── expected-markdown/
│   ├── expected-json/
│   ├── search/
│   └── corrupt-storage/
├── unit/
├── contract/
├── integration/
├── pipeline/
├── performance/
└── e2e/
```

### 4.2 Required Test API

```js
test(name, function)
describe(name, function)
beforeEach(function)
afterEach(function)
assertEqual(actual, expected)
assertDeepEqual(actual, expected)
assertTrue(value)
assertFalse(value)
assertIncludes(collection, value)
assertThrows(function, expectedCode)
assertResultOk(result)
assertResultError(result, expectedCode)
```

### 4.3 Test Result Structure

```js
{
  id: "URL-UNIT-001",
  suite: "URL Normalization",
  name: "removes URL fragment",
  status: "PASSED | FAILED | SKIPPED",
  durationMs: 0,
  error: null,
  evidence: {}
}
```

### 4.4 Harness Requirements

- Run tests in declaration order.
- Support synchronous and asynchronous tests.
- Reset mocks and shared state after each test.
- Enforce an individual test timeout.
- Continue after a failed test.
- Show passed, failed, and skipped counts.
- Export a machine-readable JSON report.
- Escape test names and errors in the HTML reporter.
- Use no `eval`, remote script, npm package, or external test service.

---

## 5. Test Naming

Format:

```text
<AREA>-<LEVEL>-<NUMBER>
```

Examples:

```text
URL-UNIT-001
SCOPE-UNIT-014
STORE-INT-006
PIPE-E2E-003
PERF-LOAD-008
```

Test names must describe behavior clearly.

Good:

```text
URL-UNIT-001 — resolves a relative documentation link
URL-UNIT-002 — removes fragments before duplicate comparison
```

Bad:

```text
test1
normal case
works
```

---

## 6. Fixture Design

### 6.1 Fixture Rules

Every fixture must be:

- Local and deterministic
- Small enough to inspect
- Focused on specific behavior
- Free from live external dependencies
- Version controlled
- Accompanied by expected results

### 6.2 Core HTML Fixtures

```text
article-simple.html
article-nested-headings.html
article-code-heavy.html
article-table-heavy.html
sidebar-heavy.html
multiple-main-candidates.html
navigation-only.html
empty-page.html
hidden-content.html
cookie-banner.html
malformed-html.html
large-page.html
query-links.html
base-tag-links.html
canonical-link.html
repeated-boilerplate-a.html
repeated-boilerplate-b.html
near-duplicate-a.html
near-duplicate-b.html
complex-table.html
```

### 6.3 Local Crawl Website Fixtures

```text
crawl-sites/basic-docs/
crawl-sites/circular-links/
crawl-sites/out-of-scope-links/
crawl-sites/versioned-query-pages/
crawl-sites/duplicate-pages/
crawl-sites/failing-pages/
crawl-sites/large-docs/
```

Each fixture site must document:

- Expected accepted URLs
- Expected rejected URLs
- Expected discovery order
- Expected final archive order
- Expected failures and reason codes

### 6.4 Golden Output Fixtures

```text
expected-markdown/basic-docs.md
expected-json/basic-docs.json
expected-json/basic-crawl-report.json
search/basic-query-results.json
```

Tests must never overwrite approved golden outputs automatically.

---

## 7. Mocking Strategy

### 7.1 Fetch Mock

Must support:

- Responses configured by URL
- Status codes and headers
- Redirect chains
- Delays and timeouts
- Network failures
- Response bodies
- Request history

### 7.2 Storage Mock

Must support:

- Object stores
- Primary keys
- Required index queries
- Transactions
- Commit and rollback
- State-version conflicts
- Quota-like failures
- Corrupted records

Real IndexedDB integration tests are still required.

### 7.3 Runtime Message Mock

Must support:

- Message listeners
- Request/response correlation
- Duplicate request IDs
- Delayed replies
- Unknown message types

### 7.4 Clock Mock

Used for:

- Retry delay
- Timeout behavior
- Lease expiry
- Timestamp generation
- Deterministic reports

### 7.5 Identifier Provider

Production may use `crypto.getRandomValues()`. Tests must inject a deterministic identifier provider.

---

# Part I — Core Algorithm Tests

## 8. URL Normalization

```text
URL-UNIT-001 Relative path resolves against parent URL.
URL-UNIT-002 Root-relative path resolves correctly.
URL-UNIT-003 Protocol-relative URL resolves correctly.
URL-UNIT-004 Fragment is removed.
URL-UNIT-005 HTTPS default port is removed.
URL-UNIT-006 HTTP default port is removed.
URL-UNIT-007 Non-default port is preserved.
URL-UNIT-008 Scheme and hostname are lowercased.
URL-UNIT-009 Dot path segments are resolved.
URL-UNIT-010 Duplicate path slashes are normalized.
URL-UNIT-011 Root slash remains intact.
URL-UNIT-012 Trailing slash follows policy.
URL-UNIT-013 Query parameters are sorted.
URL-UNIT-014 Duplicate query keys receive stable ordering.
URL-UNIT-015 Tracking parameters are removed by policy.
URL-UNIT-016 Explicit keep rule overrides removal.
URL-UNIT-017 Documentation version parameter is preserved.
URL-UNIT-018 Encoded path remains valid.
URL-UNIT-019 Unsupported protocol is rejected.
URL-UNIT-020 Empty input is rejected.
URL-UNIT-021 Malformed URL is rejected.
URL-UNIT-022 Equivalent inputs produce identical canonical URLs.
URL-UNIT-023 Input objects are not mutated.
URL-UNIT-024 Normalization is idempotent.
```

## 9. Scope Guard

```text
SCOPE-UNIT-001 Same origin and path is accepted.
SCOPE-UNIT-002 Different scheme is outside origin.
SCOPE-UNIT-003 Different hostname is rejected.
SCOPE-UNIT-004 Different port is rejected.
SCOPE-UNIT-005 Exact allowed path is accepted.
SCOPE-UNIT-006 Child path is accepted.
SCOPE-UNIT-007 /docs-old is not treated as a child of /docs.
SCOPE-UNIT-008 Parent path is rejected.
SCOPE-UNIT-009 Blocked extension is rejected.
SCOPE-UNIT-010 Exclusion pattern is applied.
SCOPE-UNIT-011 Inclusion pattern is required when configured.
SCOPE-UNIT-012 Maximum depth is enforced.
SCOPE-UNIT-013 Maximum page limit is enforced.
SCOPE-UNIT-014 Visited URL is rejected.
SCOPE-UNIT-015 Queued URL is rejected.
SCOPE-UNIT-016 Every rejection includes a reason code.
SCOPE-UNIT-017 Check order is deterministic.
```

## 10. Priority Queue

```text
QUEUE-UNIT-001 Higher score dequeues first.
QUEUE-UNIT-002 Lower depth wins equal score.
QUEUE-UNIT-003 Earlier discovery sequence wins next tie.
QUEUE-UNIT-004 Canonical URL provides stable tie-breaker.
QUEUE-UNIT-005 Duplicate URL cannot be inserted.
QUEUE-UNIT-006 Queue size limit is enforced.
QUEUE-UNIT-007 Empty dequeue returns null.
QUEUE-UNIT-008 Membership set updates after dequeue.
QUEUE-UNIT-009 Large insertion set preserves heap invariant.
QUEUE-UNIT-010 Stable input produces stable output order.
QUEUE-UNIT-011 Input task is not mutated.
QUEUE-UNIT-012 Cancellation preserves heap invariant.
```

## 11. Crawl State Machine

A matrix test must evaluate every state/event pair.

```text
STATE-UNIT-001 IDLE + CREATE -> PLANNING.
STATE-UNIT-002 PLANNING + PLAN_READY -> READY.
STATE-UNIT-003 READY + START -> RUNNING.
STATE-UNIT-004 RUNNING + PAUSE -> PAUSING.
STATE-UNIT-005 PAUSING + SAFE_POINT -> PAUSED.
STATE-UNIT-006 PAUSED + RESUME -> RUNNING.
STATE-UNIT-007 RUNNING + QUEUE_EMPTY -> FINALIZING.
STATE-UNIT-008 FINALIZING + VALIDATION_OK -> COMPLETED.
STATE-UNIT-009 Non-terminal + CANCEL -> CANCELLED.
STATE-UNIT-010 Non-terminal + FATAL -> FAILED.
STATE-UNIT-011 Terminal states reject transitions.
STATE-UNIT-012 Invalid transition has no side effect.
STATE-UNIT-013 Transition evidence preserves previous and next state.
```

---

# Part II — Fetch and Discovery Tests

## 12. Fetcher

```text
FETCH-UNIT-001 Successful HTML response is accepted.
FETCH-UNIT-002 XHTML response is accepted.
FETCH-UNIT-003 JSON response is rejected.
FETCH-UNIT-004 PDF response is rejected.
FETCH-UNIT-005 Timeout is recoverable.
FETCH-UNIT-006 Network error is recoverable.
FETCH-UNIT-007 404 is permanent.
FETCH-UNIT-008 410 is permanent.
FETCH-UNIT-009 401 is classified correctly.
FETCH-UNIT-010 403 is classified correctly.
FETCH-UNIT-011 429 is recoverable with delay.
FETCH-UNIT-012 500 is recoverable within retry limit.
FETCH-UNIT-013 Redirect within scope is accepted.
FETCH-UNIT-014 Redirect outside configured scope is rejected.
FETCH-UNIT-015 Final URL is canonicalized.
FETCH-UNIT-016 Oversized HTML is rejected.
FETCH-UNIT-017 Abort signal stops the request.
FETCH-UNIT-018 Request delay policy is respected.
FETCH-UNIT-019 Request history contains approved URLs only.
```

## 13. Link Discovery

```text
LINK-UNIT-001 Discovers absolute links.
LINK-UNIT-002 Discovers relative links.
LINK-UNIT-003 Honors base tag.
LINK-UNIT-004 Removes fragments before deduplication.
LINK-UNIT-005 Rejects unsupported protocols.
LINK-UNIT-006 Rejects outside-origin links.
LINK-UNIT-007 Rejects outside-path links.
LINK-UNIT-008 Merges evidence for duplicate anchors.
LINK-UNIT-009 Preserves first discovery sequence.
LINK-UNIT-010 Extracts normalized label text.
LINK-UNIT-011 Detects navigation placement.
LINK-UNIT-012 Applies priority scoring.
LINK-UNIT-013 Records rejected candidates with reason codes.
LINK-UNIT-014 Empty href is handled safely.
LINK-UNIT-015 Circular link cannot enter queue twice.
```

---

# Part III — Extraction and Export Tests

## 14. DOM Cleanup

```text
DOM-UNIT-001 Removes script elements from extraction input.
DOM-UNIT-002 Removes style elements.
DOM-UNIT-003 Removes form controls.
DOM-UNIT-004 Removes hidden attribute content.
DOM-UNIT-005 Removes aria-hidden content.
DOM-UNIT-006 Removes display:none content.
DOM-UNIT-007 Removes strong cookie-banner fixture.
DOM-UNIT-008 Keeps meaningful callout content.
DOM-UNIT-009 Does not mutate original document.
DOM-UNIT-010 Malformed HTML does not crash cleanup.
```

## 15. Main-Content Selection

```text
CONTENT-UNIT-001 Selects main element.
CONTENT-UNIT-002 Selects article over navigation-heavy container.
CONTENT-UNIT-003 Selects role=main container.
CONTENT-UNIT-004 Penalizes link-heavy sidebar.
CONTENT-UNIT-005 Rewards headings and paragraphs.
CONTENT-UNIT-006 Preserves code-heavy documentation.
CONTENT-UNIT-007 Selects fallback container when semantic tags are absent.
CONTENT-UNIT-008 Returns alternate candidates.
CONTENT-UNIT-009 Fails weak navigation-only page.
CONTENT-UNIT-010 Score evidence matches calculated features.
CONTENT-UNIT-011 Repeated calls select the same root.
```

## 16. Semantic Block Extraction

```text
EXTRACT-UNIT-001 Extracts title and headings.
EXTRACT-UNIT-002 Preserves paragraph order.
EXTRACT-UNIT-003 Preserves inline code.
EXTRACT-UNIT-004 Preserves code blocks exactly.
EXTRACT-UNIT-005 Detects code language hint.
EXTRACT-UNIT-006 Extracts ordered list.
EXTRACT-UNIT-007 Extracts unordered list.
EXTRACT-UNIT-008 Preserves nested lists.
EXTRACT-UNIT-009 Extracts blockquote.
EXTRACT-UNIT-010 Extracts meaningful links.
EXTRACT-UNIT-011 Avoids duplicate list paragraphs.
EXTRACT-UNIT-012 Avoids duplicate table cells.
EXTRACT-UNIT-013 Removes adjacent duplicate blocks.
EXTRACT-UNIT-014 Records heading path.
EXTRACT-UNIT-015 Handles pages without headings.
EXTRACT-UNIT-016 Repairs heading-level jumps for export.
```

## 17. Tables

```text
TABLE-UNIT-001 Extracts simple headers and rows.
TABLE-UNIT-002 Infers th header row.
TABLE-UNIT-003 Pads short rows.
TABLE-UNIT-004 Expands colspan.
TABLE-UNIT-005 Expands rowspan.
TABLE-UNIT-006 Preserves inline code in cells.
TABLE-UNIT-007 Handles caption.
TABLE-UNIT-008 Complex spans use readable fallback.
TABLE-UNIT-009 Oversized table uses bounded fallback.
TABLE-UNIT-010 Empty table does not produce broken output.
```

## 18. Markdown and JSON

```text
MD-UNIT-001 Escapes Markdown text characters.
MD-UNIT-002 Does not modify code content.
MD-UNIT-003 Chooses fence longer than internal backtick run.
MD-UNIT-004 Renders ordered list.
MD-UNIT-005 Renders nested list indentation.
MD-UNIT-006 Renders table with escaped pipes.
MD-UNIT-007 Normalizes heading levels.
MD-UNIT-008 Includes source URL.
MD-UNIT-009 Removes excessive blank lines.
MD-UNIT-010 Same page produces byte-identical Markdown.
JSON-UNIT-001 Uses documented schema version.
JSON-UNIT-002 Uses stable object-key ordering.
JSON-UNIT-003 Uses stable page ordering.
JSON-UNIT-004 Repeat export is byte-identical for stable snapshot.
```

---

# Part IV — Local Intelligence Tests

## 19. Duplicate Detection

```text
DUP-UNIT-001 Identical normalized text has exact hash match.
DUP-UNIT-002 Case and whitespace differences remain normalized duplicate.
DUP-UNIT-003 Different code content affects comparison evidence.
DUP-UNIT-004 Strong near duplicate exceeds threshold.
DUP-UNIT-005 Different pages remain below threshold.
DUP-UNIT-006 Short text is handled safely.
DUP-UNIT-007 Shingle count obeys cap.
DUP-UNIT-008 Similarity is symmetric.
DUP-UNIT-009 Identical sets produce one.
DUP-UNIT-010 Disjoint sets produce zero.
```

## 20. Boilerplate Detection

```text
BOILER-UNIT-001 Repeated block frequency increases once per page.
BOILER-UNIT-002 Duplicate block inside one page does not double-count.
BOILER-UNIT-003 Rare content is not classified as boilerplate.
BOILER-UNIT-004 Short block below minimum length is ignored.
BOILER-UNIT-005 Strong repeated block is classified correctly.
BOILER-UNIT-006 Repeated warning is flagged but not deleted automatically.
BOILER-UNIT-007 Stable page order gives stable model output.
BOILER-UNIT-008 Stored sample text is bounded.
```

## 21. Quality Scoring

```text
QUALITY-UNIT-001 Strong fixture receives strong band.
QUALITY-UNIT-002 Empty fixture receives failed band.
QUALITY-UNIT-003 Missing title lowers score.
QUALITY-UNIT-004 Broken hierarchy creates warning.
QUALITY-UNIT-005 High boilerplate ratio lowers score.
QUALITY-UNIT-006 Exact duplicate lowers uniqueness score.
QUALITY-UNIT-007 Preserved code improves code dimension.
QUALITY-UNIT-008 Missing table lowers table dimension.
QUALITY-UNIT-009 Weights total one.
QUALITY-UNIT-010 Score remains inside 0..100.
QUALITY-UNIT-011 Same evidence produces same score.
```

## 22. Recovery Manager

```text
RECOVERY-UNIT-001 Cancellation wins all other decisions.
RECOVERY-UNIT-002 Permanent failure is not retried.
RECOVERY-UNIT-003 Recoverable timeout retries when attempts remain.
RECOVERY-UNIT-004 Retry limit is never exceeded.
RECOVERY-UNIT-005 Retry delay doubles within cap.
RECOVERY-UNIT-006 Retry-After value is honored.
RECOVERY-UNIT-007 Alternate content root retries extraction.
RECOVERY-UNIT-008 Weak usable page is accepted with warning.
RECOVERY-UNIT-009 Permanent failure becomes failed or skipped.
RECOVERY-UNIT-010 Every decision has reason and evidence.
```

---

# Part V — Storage and Messaging Tests

## 23. IndexedDB

Run against real IndexedDB in a browser test page.

```text
STORE-INT-001 Opens database at expected version.
STORE-INT-002 Creates required object stores.
STORE-INT-003 Creates required indexes.
STORE-INT-004 Stores and retrieves crawl configuration.
STORE-INT-005 Stores page before completion transition.
STORE-INT-006 Rolls back failed transaction.
STORE-INT-007 Prevents stale state-version write.
STORE-INT-008 Re-index replaces old page postings.
STORE-INT-009 Delete crawl removes dependent records.
STORE-INT-010 Pagination cursor is stable.
STORE-INT-011 Corrupted optional field receives safe default.
STORE-INT-012 Unsupported future schema is rejected.
STORE-INT-013 Migration preserves valid records.
STORE-INT-014 Quota error becomes structured failure.
STORE-INT-015 Export snapshot remains immutable.
```

## 24. Message Contracts

```text
MSG-UNIT-001 Valid envelope is accepted.
MSG-UNIT-002 Unknown type is rejected.
MSG-UNIT-003 Unsupported protocol version is rejected.
MSG-UNIT-004 Missing request ID is rejected.
MSG-UNIT-005 Invalid payload never reaches handler.
MSG-UNIT-006 Response preserves request ID.
MSG-UNIT-007 Duplicate request returns idempotent result.
MSG-UNIT-008 Handler failure becomes structured error.
MSG-UNIT-009 Oversized message is rejected when configured.
MSG-UNIT-010 Progress event is replay-safe.
MSG-UNIT-011 Every public message has validator coverage.
```

---

# Part VI — Search and Question Answering Tests

## 25. Tokenizer

```text
TOKEN-UNIT-001 Lowercases normal words.
TOKEN-UNIT-002 Preserves IndexedDB as searchable indexeddb.
TOKEN-UNIT-003 Preserves C++ according to policy.
TOKEN-UNIT-004 Preserves node.js.
TOKEN-UNIT-005 Preserves foo_bar.
TOKEN-UNIT-006 Preserves HTTP/2.
TOKEN-UNIT-007 Removes configured stop word.
TOKEN-UNIT-008 Keeps technical identifier.
TOKEN-UNIT-009 Normalizes Unicode form.
TOKEN-UNIT-010 Enforces maximum token length.
TOKEN-UNIT-011 Empty input returns empty list.
TOKEN-UNIT-012 Same text produces same tokens.
```

## 26. Indexing

```text
INDEX-INT-001 Splits page into heading sections.
INDEX-INT-002 Generates stable section IDs.
INDEX-INT-003 Indexes heading and body frequencies separately.
INDEX-INT-004 Stores document frequency once per section.
INDEX-INT-005 Caps positions.
INDEX-INT-006 Removes old postings before re-index.
INDEX-INT-007 Posting references existing section.
INDEX-INT-008 Indexing one page does not rebuild all pages.
INDEX-INT-009 Empty section is ignored.
INDEX-INT-010 Large section is split into bounded passages.
```

## 27. Search Ranking

```text
SEARCH-UNIT-001 Rare exact term ranks correct section first.
SEARCH-UNIT-002 Heading match receives bonus.
SEARCH-UNIT-003 Phrase match outranks separated terms.
SEARCH-UNIT-004 All-term coverage receives bonus.
SEARCH-UNIT-005 Repeated body term saturates.
SEARCH-UNIT-006 Title match receives bonus.
SEARCH-UNIT-007 Proximity affects ranking.
SEARCH-UNIT-008 Empty query returns EMPTY_QUERY.
SEARCH-UNIT-009 Unknown terms return empty results.
SEARCH-UNIT-010 Equal scores use stable archive order.
SEARCH-UNIT-011 Maximum result count is enforced.
SEARCH-UNIT-012 Source filter works.
SEARCH-UNIT-013 Snippet contains relevant evidence.
SEARCH-UNIT-014 Repeated search is deterministic.
```

## 28. Extractive Question Answering

```text
QA-UNIT-001 Direct factual question returns supporting passage.
QA-UNIT-002 Answer includes source URL.
QA-UNIT-003 Answer includes heading path.
QA-UNIT-004 Exact phrase improves passage score.
QA-UNIT-005 Multiple supporting pages may be returned.
QA-UNIT-006 Overlapping passages are deduplicated.
QA-UNIT-007 Missing fact returns insufficient evidence.
QA-UNIT-008 Low query coverage returns insufficient evidence.
QA-UNIT-009 Generic question words are down-weighted.
QA-UNIT-010 High-confidence case meets thresholds.
QA-UNIT-011 Medium-confidence case remains labelled medium.
QA-UNIT-012 Engine returns extracts rather than invented statements.
QA-UNIT-013 Candidate and passage limits are enforced.
QA-UNIT-014 Same archive and question produce stable answer order.
```

---

# Part VII — Pipeline and End-to-End Tests

## 29. Pipeline Tests

### PIPE-INT-001 — Basic Documentation Page

Expected:

- One accepted page
- Title and headings extracted
- Search index created
- Markdown matches golden fixture
- Archive validation passes

### PIPE-INT-002 — Sidebar-Heavy Page

Expected:

- Main article selected
- Sidebar content substantially reduced
- Quality score acceptable or strong

### PIPE-INT-003 — Code and Table Page

Expected:

- Code preserved exactly
- Table remains readable
- Generated Markdown validates

### PIPE-INT-004 — Near-Duplicate Pages

Expected:

- Both records remain inspectable
- Near-duplicate relation is reported
- No silent deletion

### PIPE-INT-005 — Weak Extraction Recovery

Expected:

- First candidate fails threshold
- Alternate candidate is tried
- Final decision and evidence are persisted

### PIPE-INT-006 — Search and QA

Expected:

- Indexed technical term is found
- Direct question returns source-backed extract
- Missing question returns insufficient evidence

## 30. Chrome Extension E2E Tests

```text
E2E-001 Extension loads without manifest error.
E2E-002 Popup opens with active tab URL.
E2E-003 Invalid configuration blocks start.
E2E-004 Valid crawl starts local fixture website.
E2E-005 Dashboard shows live counters.
E2E-006 Pause reaches paused state.
E2E-007 Resume continues queue.
E2E-008 Cancel prevents new fetches.
E2E-009 Worker interruption resumes correctly.
E2E-010 Completed crawl exports Markdown.
E2E-011 Completed crawl exports JSON and report.
E2E-012 Failed and skipped pages show reason codes.
E2E-013 Search UI returns section result.
E2E-014 QA UI returns source-backed passage.
E2E-015 Dashboard reload restores state.
E2E-016 Keyboard navigation reaches core controls.
```

Automated browser driving can be added later. First release must provide reproducible manual E2E instructions.

---

# Part VIII — Reliability and Fault Injection

## 31. Restart and Interruption

```text
RELIABILITY-001 Suspend worker before first task.
RELIABILITY-002 Suspend worker during queued state.
RELIABILITY-003 Suspend after fetch before extraction commit.
RELIABILITY-004 Suspend after page storage before completion transition.
RELIABILITY-005 Restart while paused.
RELIABILITY-006 Restart during finalization.
RELIABILITY-007 Duplicate alarm does not process task twice.
RELIABILITY-008 Expired operation lease is recovered.
RELIABILITY-009 Active lease prevents concurrent owner.
RELIABILITY-010 Completed page remains intact after interruption.
```

Required invariant:

A page may be fetched again after interruption, but it must never be marked complete without a stored page record.

## 32. Corrupted State

```text
CORRUPT-001 Missing optional field receives default.
CORRUPT-002 Missing required page ID rejects record.
CORRUPT-003 Invalid crawl state is reported.
CORRUPT-004 Posting referencing missing section is detected.
CORRUPT-005 Duplicate key does not overwrite unrelated record.
CORRUPT-006 Invalid schema version is rejected.
CORRUPT-007 Broken export snapshot fails validation.
CORRUPT-008 Failure can be inspected without extension crash.
```

---

# Part IX — Performance Tests

## 33. Measurement Rules

- Use a clean browser profile where practical.
- Record browser version and hardware class.
- Use local fixtures to remove network variability.
- Run each measurement multiple times.
- Report median and worst observed result.
- Establish thresholds after baseline measurement.

## 34. Required Scenarios

```text
PERF-001 Normalize 10,000 generated URLs.
PERF-002 Insert and remove 10,000 queue tasks.
PERF-003 Extract a large technical page.
PERF-004 Process a page with thousands of links.
PERF-005 Index 1,000 bounded sections.
PERF-006 Search a large local index.
PERF-007 Build Markdown archive from many pages.
PERF-008 Paginate a large dashboard page list.
PERF-009 Resume from a large persisted queue.
PERF-010 Boilerplate model remains bounded.
```

### 34.1 Metrics

- Duration
- Retained memory where measurable
- Long-task count
- DOM traversal count
- Storage transaction count
- Index write count
- Queue size
- Export size

### 34.2 Failure Rules

A performance test fails when:

- Work exceeds a documented hard limit.
- UI becomes unusable during bounded work.
- Memory grows without returning after work completes.
- Algorithm behavior no longer matches intended complexity.
- Repeated runs accumulate duplicate storage or index records.

---

# Part X — Accessibility and Usability

## 35. Accessibility Checks

```text
A11Y-001 All form inputs have labels.
A11Y-002 Core controls are keyboard reachable.
A11Y-003 Focus order follows workflow.
A11Y-004 Visible focus indicator exists.
A11Y-005 Status changes have accessible text.
A11Y-006 Errors are associated with fields.
A11Y-007 Color is not the only status indicator.
A11Y-008 External links have understandable labels.
A11Y-009 Tables have headers where appropriate.
A11Y-010 Popup remains usable under browser zoom.
```

## 36. Usability Acceptance Tasks

A first-time user should be able to:

1. Install through Load Unpacked.
2. Open a documentation page.
3. Configure a bounded crawl.
4. Start and monitor the crawl.
5. Understand failed and skipped URLs.
6. Export Markdown.
7. Search the archive.
8. Ask a question and inspect its source.

Any step requiring undocumented developer knowledge is a release blocker.

---

# Part XI — Milestone Test Gates

## 37. M0 — Foundation

Required:

- Manifest loads
- Popup and dashboard open
- Message smoke test passes
- Local settings persist
- Test harness passes self-tests

## 38. M1 — URL Intelligence

Required:

- URL and scope tests pass
- Duplicate URL registry tests pass
- No out-of-scope fixture enters queue

## 39. M2 — Queue and State

Required:

- Queue ordering tests pass
- State transition matrix passes
- Pause, resume, cancel, and restart tests pass

## 40. M3 — Fetch and Discovery

Required:

- Fetch classification tests pass
- Redirect scope tests pass
- Circular fixture does not create unbounded queue

## 41. M4 — Extraction

Required:

- Fixtures preserve headings, lists, tables, and code
- Navigation-heavy fixture selects correct content root
- Malformed HTML does not crash extraction

## 42. M5 — Export

Required:

- Golden Markdown and JSON match
- Repeat export is byte-identical
- Validator accepts valid fixtures and rejects broken fixtures

## 43. M6 — Agent and Quality

Required:

- Quality bands are calibrated
- Every controller decision branch is tested
- Recovery remains bounded

## 44. M7 — Search

Required:

- Search relevance fixture passes
- Stable ranking tests pass
- Re-index tests pass

## 45. M8 — Question Answering

Required:

- Direct questions return sources
- Unsupported questions return insufficient evidence
- No unsupported generated statement appears

## 46. M9 — Release

Required:

- Full E2E lifecycle passes
- Reliability, accessibility, and performance tests pass
- Installation and usage documentation succeeds from a clean profile

---

# Part XII — Coverage and Traceability

## 47. Requirement Coverage

Every functional and non-functional requirement in the current implementation scope must map to one or more test IDs.

## 48. Decision Coverage

Every documented decision branch must have a test:

- Accept
- Reject
- Retry
- Skip
- Fail
- Cancel
- Finalize
- Insufficient evidence

Happy-path testing alone is not enough.

## 49. Traceability Matrix

Maintain:

```text
docs/TEST_TRACEABILITY_MATRIX.md
```

Columns:

```text
Requirement ID
Module
Test ID
Fixture
Expected Result
Automation Status
Latest Result
Evidence Location
```

## 50. Required Evidence

For each milestone:

- Machine-readable test report
- Human-readable summary
- Failed-test details
- Browser/platform information for integration and E2E runs
- Golden-output diff when exports change
- Explanation for skipped tests

---

# Part XIII — Defect Handling

## 51. Defect Severity

```text
Critical — data corruption or fundamentally unusable release.
High     — crawl cannot complete, resume fails, or export is invalid.
Medium   — feature is incorrect but has a workaround.
Low      — minor UI, wording, or non-blocking issue.
```

## 52. Regression Requirement

Every fixed defect must add a regression test that:

1. Fails before the fix.
2. Passes after the fix.
3. Uses the smallest representative fixture.
4. Includes the issue or defect ID.

---

# Part XIV — Release Test Checklist

## 53. Automated Gate

- All required suites pass.
- No unexplained skipped critical tests.
- Golden files are reviewed.
- No unstable ordering failures remain.
- No unbounded retry or queue behavior remains.

## 54. Manual Gate

- Install in clean Chrome profile.
- Crawl basic local documentation site.
- Pause and resume.
- Interrupt and restore.
- Inspect failed and skipped pages.
- Export all supported formats.
- Search archive.
- Ask supported and unsupported questions.
- Confirm keyboard usability.

## 55. Version 1.0 Exit Criteria

Testing is complete for version 1.0 when:

1. All milestone gates pass.
2. Every current project requirement maps to a test.
3. Critical and high defects are closed.
4. Stable snapshots produce deterministic exports and search order.
5. Interruption cannot falsely complete or corrupt a page.
6. Search and question answering remain local and source-backed.
7. A clean-profile manual acceptance run succeeds.
8. Test evidence is stored with the release.
9. Documentation matches implemented behavior and supported limits.
