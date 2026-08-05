# Site Text Archiver — Testing Strategy, Fixtures, and Test Cases

## 1. Purpose

This document defines how Site Text Archiver will be verified from individual pure functions through complete Chrome-extension workflows. It specifies the test architecture, scratch-built test harness, fixtures, test naming, module test cases, failure injection, performance checks, security tests, release gates, and evidence required before any milestone is marked complete.

The project is built without npm packages, external test frameworks, cloud services, hosted AI models, external AI APIs, or backend infrastructure. Testing therefore uses browser-native JavaScript, static HTML fixtures, local deterministic mocks, Chrome extension test pages, and a small project-owned test harness.

## 2. Testing Objectives

Testing must prove that the extension is:

1. Functionally correct.
2. Deterministic.
3. Safe within the configured crawl scope.
4. Resumable after Manifest V3 service-worker suspension.
5. Resistant to malformed and hostile page content.
6. Capable of preserving documentation structure.
7. Bounded in retries, memory, queue size, and processing time.
8. Fully local for extraction, indexing, search, and question answering.
9. Explainable through errors, warnings, evidence, and reason codes.
10. Usable by a non-developer in the final release.

## 3. Test Levels

```text
L1 — Pure unit tests
L2 — Module contract tests
L3 — Storage and adapter integration tests
L4 — Pipeline integration tests
L5 — Chrome extension end-to-end tests
L6 — Reliability, security, and performance tests
L7 — Manual release acceptance tests
```

### 3.1 L1 — Pure Unit Tests

Used for algorithms without browser or storage dependencies:

- URL normalization
- Scope validation
- Unsafe action detection
- Priority scoring
- Heap ordering
- State transitions
- Content scoring
- Markdown escaping
- Tokenization
- Search ranking
- Passage ranking
- Validation rules

These tests must be fast and runnable from a local browser test page.

### 3.2 L2 — Module Contract Tests

Verify that public module functions:

- Accept documented input shapes.
- Reject invalid data.
- Return the shared result contract.
- Use documented error codes.
- Preserve deterministic output.
- Do not leak implementation-specific mutable state.

### 3.3 L3 — Integration Tests

Verify boundaries such as:

- Message router to runtime controller.
- Crawler to fetch adapter.
- Extractor to quality checker.
- Page storage to section storage.
- Section storage to local index.
- Archive builder to validator.
- Dashboard queries to pagination adapters.

### 3.4 L4 — Pipeline Tests

Run complete deterministic pipelines against local fixtures:

```text
HTML fixture
-> parse
-> clean DOM
-> select content root
-> extract blocks
-> score quality
-> store page
-> build sections
-> index
-> search
-> question answering
-> export
-> validate
```

### 3.5 L5 — End-to-End Tests

Load the extension through Chrome's developer mode and verify real user flows against a local fixture website.

### 3.6 L6 — Reliability, Security, and Performance

Test interruption, corrupted state, malformed content, oversized pages, unsafe links, queue pressure, repeated pages, and large archives.

### 3.7 L7 — Manual Release Acceptance

A human performs the documented installation and usage flow without developer tools being required.

---

## 4. Test Harness Architecture

### 4.1 Proposed Structure

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
└── security/
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

### 4.3 Test Result Model

```js
{
  id: "test_url_001",
  suite: "URL Normalization",
  name: "removes URL fragment",
  status: "PASSED | FAILED | SKIPPED",
  durationMs: 0,
  error: null,
  evidence: {}
}
```

### 4.4 Harness Requirements

- Run tests in deterministic declaration order.
- Reset mocks and shared state after every test.
- Support synchronous and asynchronous tests.
- Enforce an individual test timeout.
- Continue running after a failed test.
- Show passed, failed, and skipped counts.
- Export a machine-readable JSON report.
- Escape all test names and errors in the HTML reporter.
- Use no `eval`, remote scripts, or npm packages.

---

## 5. Test Naming and Identification

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
SECURITY-ADV-008
```

Test names should describe behavior:

```text
URL-UNIT-001 — resolves a relative documentation link
URL-UNIT-002 — removes fragments before duplicate comparison
SCOPE-UNIT-001 — rejects a different origin
```

Do not use unclear names such as `test1`, `normal case`, or `works`.

---

## 6. Fixture Design

### 6.1 Fixture Rules

Every fixture must be:

- Local and deterministic.
- Small enough to understand.
- Focused on one or a few behaviors.
- Free from live external dependencies.
- Version controlled.
- Accompanied by expected results.
- Safe to render or parsed only as untrusted content.

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
unsafe-links.html
query-links.html
base-tag-links.html
canonical-link.html
javascript-navigation.html
repeated-boilerplate-a.html
repeated-boilerplate-b.html
near-duplicate-a.html
near-duplicate-b.html
complex-table.html
hostile-markup.html
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
crawl-sites/unsafe-actions/
```

Each site must contain a small sitemap document describing:

- Expected accepted URLs.
- Expected rejected URLs.
- Expected discovery order.
- Expected final archive order.
- Expected failures and reason codes.

### 6.4 Golden Fixtures

Golden outputs are approved expected files:

```text
expected-markdown/basic-docs.md
expected-json/basic-docs.json
expected-json/basic-crawl-report.json
search/basic-query-results.json
```

Golden fixtures must be reviewed carefully. Tests must not automatically overwrite them when output changes.

---

## 7. Mocking Strategy

### 7.1 Fetch Mock

Must support:

- Configured responses by URL.
- Status codes.
- Headers.
- Redirect chains.
- Delays.
- Timeouts.
- Network failures.
- Response bodies.
- Request history.

Example:

```js
fetchMock.when("https://example.test/docs/").respond({
  status: 200,
  headers: { "content-type": "text/html" },
  body: "<main><h1>Docs</h1></main>"
});
```

### 7.2 Storage Mock

Must model:

- Object stores.
- Primary keys.
- Index queries needed by modules.
- Transactions.
- Commit and rollback.
- Version conflicts.
- Quota-like failures.
- Corrupted records.

The mock is not a full reimplementation of IndexedDB. Real IndexedDB integration tests are also required.

### 7.3 Runtime Message Mock

Must support:

- Message listeners.
- Request/response correlation.
- Duplicate request IDs.
- Delayed replies.
- Unknown messages.
- Sender identity fixtures.

### 7.4 Clock Mock

Used for:

- Retry delays.
- Timeouts.
- Lease expiry.
- Timestamp generation.
- Deterministic test output.

### 7.5 Randomness Control

Production identifiers may use `crypto.getRandomValues()`. Tests must inject a deterministic identifier provider instead of weakening production randomness.

---

# Part I — Core Algorithm Test Cases

## 8. URL Normalization Tests

### Required Cases

```text
URL-UNIT-001 Relative path resolves against parent URL.
URL-UNIT-002 Root-relative path resolves correctly.
URL-UNIT-003 Protocol-relative URL resolves correctly.
URL-UNIT-004 Fragment is removed.
URL-UNIT-005 HTTPS default port 443 is removed.
URL-UNIT-006 HTTP default port 80 is removed.
URL-UNIT-007 Non-default port is preserved.
URL-UNIT-008 Scheme and hostname are lowercased.
URL-UNIT-009 Dot path segments are resolved.
URL-UNIT-010 Duplicate path slashes are normalized.
URL-UNIT-011 Root slash remains intact.
URL-UNIT-012 Non-root trailing slash follows policy.
URL-UNIT-013 Query parameters are sorted.
URL-UNIT-014 Duplicate query keys retain stable order by value.
URL-UNIT-015 UTM parameters are removed.
URL-UNIT-016 Explicitly retained parameter overrides removal policy.
URL-UNIT-017 Documentation version parameter is preserved.
URL-UNIT-018 Encoded path remains valid.
URL-UNIT-019 Mailto URL is rejected.
URL-UNIT-020 JavaScript URL is rejected.
URL-UNIT-021 Empty string is rejected.
URL-UNIT-022 Malformed URL is rejected.
URL-UNIT-023 Equivalent inputs produce identical canonical URLs.
URL-UNIT-024 Input objects are not mutated.
```

### Property-Style Checks

Without an external property-testing library, deterministic generated cases should verify:

- Normalizing an already normalized URL is idempotent.
- Removing a fragment never changes origin or pathname.
- Sorting query parameters twice yields the same URL.
- Canonicalization never introduces an unsupported protocol.

---

## 9. Scope Guard Tests

```text
SCOPE-UNIT-001 Same origin and path is accepted.
SCOPE-UNIT-002 Different scheme is outside origin.
SCOPE-UNIT-003 Different hostname is rejected.
SCOPE-UNIT-004 Different port is rejected.
SCOPE-UNIT-005 Exact allowed path is accepted.
SCOPE-UNIT-006 Child path is accepted.
SCOPE-UNIT-007 Similar prefix such as /docs-old is rejected for /docs.
SCOPE-UNIT-008 Parent path is rejected.
SCOPE-UNIT-009 Blocked extension is rejected.
SCOPE-UNIT-010 Exclusion pattern is applied.
SCOPE-UNIT-011 Inclusion pattern is required when configured.
SCOPE-UNIT-012 Maximum depth is enforced.
SCOPE-UNIT-013 Maximum page limit is enforced.
SCOPE-UNIT-014 Visited URL is rejected.
SCOPE-UNIT-015 Queued URL is rejected.
SCOPE-UNIT-016 Every rejection has a reason code.
SCOPE-UNIT-017 Check ordering returns the first documented reason.
```

---

## 10. Unsafe Action Detection Tests

```text
SAFE-UNIT-001 /logout is unsafe.
SAFE-UNIT-002 /signout is unsafe.
SAFE-UNIT-003 /account/delete is unsafe.
SAFE-UNIT-004 ?action=delete is unsafe.
SAFE-UNIT-005 Checkout link is unsafe.
SAFE-UNIT-006 Password reset action is unsafe.
SAFE-UNIT-007 Documentation text containing the word delete is not unsafe when URL and label are safe.
SAFE-UNIT-008 API documentation path /methods/delete-user may be conservatively rejected and reported.
SAFE-UNIT-009 Matching evidence contains the detected token.
SAFE-UNIT-010 Case differences do not bypass detection.
```

The conservative false-positive behavior in `SAFE-UNIT-008` must be documented in the skipped report.

---

## 11. Priority Queue Tests

```text
QUEUE-UNIT-001 Higher priority dequeues first.
QUEUE-UNIT-002 Lower depth wins equal priority.
QUEUE-UNIT-003 Earlier discovery sequence wins next tie.
QUEUE-UNIT-004 Canonical URL is final stable tie-breaker.
QUEUE-UNIT-005 Duplicate URL cannot be inserted.
QUEUE-UNIT-006 Queue size limit is enforced.
QUEUE-UNIT-007 Dequeue from empty queue returns null safely.
QUEUE-UNIT-008 Membership set updates after dequeue.
QUEUE-UNIT-009 Large insertion set preserves heap invariant.
QUEUE-UNIT-010 Same tasks inserted in same order produce same output order.
QUEUE-UNIT-011 Task input is not mutated.
QUEUE-UNIT-012 Remove or cancel operation preserves heap invariant.
```

---

## 12. State Machine Tests

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
STATE-UNIT-011 Terminal states reject all transitions.
STATE-UNIT-012 Invalid transitions have no side effects.
STATE-UNIT-013 Transition evidence preserves previous and next state.
```

---

# Part II — Fetch and Discovery Test Cases

## 13. Fetcher Tests

```text
FETCH-UNIT-001 Successful HTML response is accepted.
FETCH-UNIT-002 XHTML response is accepted.
FETCH-UNIT-003 JSON response is rejected.
FETCH-UNIT-004 PDF response is rejected.
FETCH-UNIT-005 Timeout is recoverable.
FETCH-UNIT-006 Network error is recoverable.
FETCH-UNIT-007 404 is permanent.
FETCH-UNIT-008 410 is permanent.
FETCH-UNIT-009 401 is permanent access failure.
FETCH-UNIT-010 403 is permanent access failure.
FETCH-UNIT-011 429 is recoverable with delay.
FETCH-UNIT-012 500 is recoverable within limit.
FETCH-UNIT-013 Redirect within scope is accepted.
FETCH-UNIT-014 Redirect outside scope is rejected.
FETCH-UNIT-015 Final URL is canonicalized.
FETCH-UNIT-016 Oversized HTML is rejected.
FETCH-UNIT-017 Abort signal stops request.
FETCH-UNIT-018 Request delay policy is respected.
FETCH-UNIT-019 Request history contains only approved URLs.
FETCH-UNIT-020 Credentials policy matches contract.
```

---

## 14. Link Discovery Tests

```text
LINK-UNIT-001 Discovers absolute links.
LINK-UNIT-002 Discovers relative links.
LINK-UNIT-003 Honors base tag.
LINK-UNIT-004 Removes fragments before deduplication.
LINK-UNIT-005 Rejects unsupported protocols.
LINK-UNIT-006 Rejects outside-origin links.
LINK-UNIT-007 Rejects outside-path links.
LINK-UNIT-008 Merges evidence for duplicate anchors.
LINK-UNIT-009 Preserves stable first discovery sequence.
LINK-UNIT-010 Extracts normalized label text.
LINK-UNIT-011 Detects navigation placement.
LINK-UNIT-012 Applies priority scoring.
LINK-UNIT-013 Records rejected candidates with reason codes.
LINK-UNIT-014 Empty href is handled safely.
LINK-UNIT-015 Circular link does not enter queue twice.
```

---

# Part III — Extraction Test Cases

## 15. DOM Cleanup Tests

```text
DOM-UNIT-001 Removes script elements.
DOM-UNIT-002 Removes style elements.
DOM-UNIT-003 Removes forms and controls.
DOM-UNIT-004 Removes hidden attribute content.
DOM-UNIT-005 Removes aria-hidden content.
DOM-UNIT-006 Removes display:none inline content.
DOM-UNIT-007 Removes strong cookie-banner fixture.
DOM-UNIT-008 Keeps meaningful callout content.
DOM-UNIT-009 Removes dangerous event-handler attributes.
DOM-UNIT-010 Does not mutate the original document.
DOM-UNIT-011 Malformed HTML does not crash cleanup.
DOM-UNIT-012 Cleanup output contains no executable scripts.
```

---

## 16. Main-Content Selection Tests

```text
CONTENT-UNIT-001 Selects main element.
CONTENT-UNIT-002 Selects article over navigation-heavy container.
CONTENT-UNIT-003 Selects role=main container.
CONTENT-UNIT-004 Penalizes link-heavy sidebar.
CONTENT-UNIT-005 Rewards headings and paragraphs.
CONTENT-UNIT-006 Preserves code-heavy documentation.
CONTENT-UNIT-007 Selects best fallback div when semantic tags are absent.
CONTENT-UNIT-008 Returns alternate candidates.
CONTENT-UNIT-009 Fails weak navigation-only page.
CONTENT-UNIT-010 Score evidence matches calculated features.
CONTENT-UNIT-011 Repeated calls produce identical selection.
CONTENT-UNIT-012 Cached subtree statistics equal direct calculation.
```

---

## 17. Semantic Block Extraction Tests

```text
EXTRACT-UNIT-001 Extracts title and headings.
EXTRACT-UNIT-002 Preserves paragraph order.
EXTRACT-UNIT-003 Preserves inline code.
EXTRACT-UNIT-004 Preserves fenced code exactly.
EXTRACT-UNIT-005 Detects code language hint.
EXTRACT-UNIT-006 Extracts ordered list.
EXTRACT-UNIT-007 Extracts unordered list.
EXTRACT-UNIT-008 Preserves nested list structure.
EXTRACT-UNIT-009 Extracts blockquote.
EXTRACT-UNIT-010 Extracts meaningful links.
EXTRACT-UNIT-011 Does not emit list paragraphs twice.
EXTRACT-UNIT-012 Does not emit table cells twice.
EXTRACT-UNIT-013 Removes adjacent duplicate blocks.
EXTRACT-UNIT-014 Records heading path for each block.
EXTRACT-UNIT-015 Handles page with no headings.
EXTRACT-UNIT-016 Repairs heading-level jump for export.
EXTRACT-UNIT-017 Keeps original heading level as evidence.
```

---

## 18. Table Tests

```text
TABLE-UNIT-001 Extracts simple header and rows.
TABLE-UNIT-002 Infers th header row.
TABLE-UNIT-003 Pads short rows.
TABLE-UNIT-004 Expands colspan.
TABLE-UNIT-005 Expands rowspan.
TABLE-UNIT-006 Preserves inline code in cells.
TABLE-UNIT-007 Handles caption.
TABLE-UNIT-008 Complex overlapping spans use readable fallback.
TABLE-UNIT-009 Oversized table triggers bounded fallback.
TABLE-UNIT-010 Empty table does not produce broken Markdown.
```

---

## 19. Markdown Tests

```text
MD-UNIT-001 Escapes Markdown text characters.
MD-UNIT-002 Does not escape code content.
MD-UNIT-003 Chooses fence longer than internal backtick run.
MD-UNIT-004 Renders ordered list.
MD-UNIT-005 Renders nested list indentation.
MD-UNIT-006 Renders table with escaped pipes.
MD-UNIT-007 Normalizes heading levels.
MD-UNIT-008 Includes source URL.
MD-UNIT-009 Removes excessive blank lines.
MD-UNIT-010 Same page produces byte-identical Markdown.
MD-UNIT-011 Duplicate titles do not break archive anchors.
MD-UNIT-012 Unsafe raw HTML is not passed through.
```

---

# Part IV — Intelligence Test Cases

## 20. Duplicate Detection Tests

```text
DUP-UNIT-001 Identical normalized text has exact hash match.
DUP-UNIT-002 Case and whitespace differences remain exact normalized duplicate.
DUP-UNIT-003 Different code content affects structure-aware evidence.
DUP-UNIT-004 Strong near duplicate exceeds threshold.
DUP-UNIT-005 Different documentation pages remain below threshold.
DUP-UNIT-006 Short text is handled safely.
DUP-UNIT-007 Shingle count obeys cap.
DUP-UNIT-008 Similarity is symmetric.
DUP-UNIT-009 Similarity of identical sets is one.
DUP-UNIT-010 Similarity of disjoint sets is zero.
```

---

## 21. Boilerplate Tests

```text
BOILER-UNIT-001 Repeated navigation block frequency increases once per page.
BOILER-UNIT-002 Duplicate block inside one page does not double-count document frequency.
BOILER-UNIT-003 Rare content is not boilerplate.
BOILER-UNIT-004 Frequent short block below minimum length is ignored.
BOILER-UNIT-005 Strong repeated block is classified correctly.
BOILER-UNIT-006 Legitimate repeated warning is flagged but not automatically deleted.
BOILER-UNIT-007 Model remains deterministic across stable page order.
BOILER-UNIT-008 Sample text is bounded.
```

---

## 22. Quality Scoring Tests

```text
QUALITY-UNIT-001 Strong fixture receives strong band.
QUALITY-UNIT-002 Empty fixture receives failed band.
QUALITY-UNIT-003 Missing title lowers score.
QUALITY-UNIT-004 Broken hierarchy creates warning.
QUALITY-UNIT-005 High boilerplate ratio lowers score.
QUALITY-UNIT-006 Exact duplicate lowers uniqueness dimension.
QUALITY-UNIT-007 Preserved code improves code dimension.
QUALITY-UNIT-008 Missing source tables lowers table preservation dimension.
QUALITY-UNIT-009 Weights total one.
QUALITY-UNIT-010 Score remains in 0..100.
QUALITY-UNIT-011 Same evidence produces same score.
QUALITY-UNIT-012 Warning thresholds match policy version.
```

---

## 23. Recovery Tests

```text
RECOVERY-UNIT-001 Cancellation wins all other decisions.
RECOVERY-UNIT-002 Safety failure is never retried.
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

## 24. IndexedDB Tests

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
STORE-INT-011 Corrupted optional field is defaulted safely.
STORE-INT-012 Unsupported future schema is rejected.
STORE-INT-013 Migration preserves valid records.
STORE-INT-014 Quota error becomes structured storage failure.
STORE-INT-015 Export snapshot remains immutable during later crawl updates.
```

---

## 25. Message Contract Tests

```text
MSG-UNIT-001 Valid envelope is accepted.
MSG-UNIT-002 Unknown type is rejected.
MSG-UNIT-003 Unsupported protocol version is rejected.
MSG-UNIT-004 Missing request ID is rejected.
MSG-UNIT-005 Invalid payload never reaches handler.
MSG-UNIT-006 Response preserves request ID.
MSG-UNIT-007 Duplicate request returns idempotent result.
MSG-UNIT-008 Handler failure becomes structured error.
MSG-UNIT-009 Oversized message is rejected when limit exists.
MSG-UNIT-010 Untrusted sender cannot invoke restricted command.
MSG-UNIT-011 Progress event is replay-safe.
MSG-UNIT-012 Every public message has validator coverage.
```

---

# Part VI — Search and Question Answering Tests

## 26. Tokenizer Tests

```text
TOKEN-UNIT-001 Lowercases normal words.
TOKEN-UNIT-002 Preserves IndexedDB as searchable indexeddb.
TOKEN-UNIT-003 Preserves C++ token according to policy.
TOKEN-UNIT-004 Preserves node.js token.
TOKEN-UNIT-005 Preserves foo_bar token.
TOKEN-UNIT-006 Preserves HTTP/2 token.
TOKEN-UNIT-007 Removes configured stop word.
TOKEN-UNIT-008 Keeps technical stop-word-like identifier.
TOKEN-UNIT-009 Normalizes Unicode form.
TOKEN-UNIT-010 Enforces maximum token length.
TOKEN-UNIT-011 Empty input returns empty list.
TOKEN-UNIT-012 Same text produces same tokens.
```

---

## 27. Indexing Tests

```text
INDEX-INT-001 Splits page by heading sections.
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

---

## 28. Search Ranking Tests

```text
SEARCH-UNIT-001 Exact rare term ranks correct section first.
SEARCH-UNIT-002 Heading match receives bonus.
SEARCH-UNIT-003 Phrase match outranks separated terms.
SEARCH-UNIT-004 All-term coverage receives bonus.
SEARCH-UNIT-005 Repeated body term saturates rather than dominating.
SEARCH-UNIT-006 Title match receives bonus.
SEARCH-UNIT-007 Proximity affects ranking.
SEARCH-UNIT-008 Empty query returns EMPTY_QUERY.
SEARCH-UNIT-009 Unknown terms return empty results safely.
SEARCH-UNIT-010 Equal scores follow stable archive and section order.
SEARCH-UNIT-011 Maximum result count is enforced.
SEARCH-UNIT-012 Source filtering works.
SEARCH-UNIT-013 Snippet contains relevant evidence.
SEARCH-UNIT-014 Repeated search is deterministic.
```

---

## 29. Extractive Question Answering Tests

```text
QA-UNIT-001 Direct factual question returns supporting passage.
QA-UNIT-002 Answer includes source URL.
QA-UNIT-003 Answer includes heading path.
QA-UNIT-004 Exact phrase improves passage score.
QA-UNIT-005 Multiple supporting pages may be returned.
QA-UNIT-006 Overlapping passages are deduplicated.
QA-UNIT-007 Missing fact returns insufficient evidence.
QA-UNIT-008 Low query coverage returns insufficient evidence.
QA-UNIT-009 Generic question terms are down-weighted.
QA-UNIT-010 High-confidence case meets all thresholds.
QA-UNIT-011 Medium-confidence case remains labelled medium.
QA-UNIT-012 Engine returns extracts rather than invented text.
QA-UNIT-013 Candidate and passage limits are enforced.
QA-UNIT-014 Same archive and question produce same answer order.
```

---

# Part VII — Pipeline and End-to-End Tests

## 30. Pipeline Tests

### PIPE-INT-001 — Basic Documentation Page

Input:

- `article-simple.html`

Expected:

- One accepted page.
- Title and headings extracted.
- Search index created.
- Markdown matches golden fixture.
- Archive validation passes.

### PIPE-INT-002 — Sidebar-Heavy Page

Expected:

- Main article selected.
- Sidebar content substantially removed.
- Quality score is acceptable or strong.

### PIPE-INT-003 — Code and Table Page

Expected:

- Code preserved byte-for-byte.
- Table remains readable.
- Generated Markdown validates.

### PIPE-INT-004 — Near-Duplicate Pages

Expected:

- Both records remain explainable.
- Near-duplicate relation is reported.
- No silent deletion.

### PIPE-INT-005 — Weak Extraction Recovery

Expected:

- First content candidate fails threshold.
- Alternate candidate is tried.
- Final decision and evidence are persisted.

### PIPE-INT-006 — Search and QA

Expected:

- Indexed technical term is found.
- Direct question returns source-backed extract.
- Missing question returns insufficient evidence.

---

## 31. Chrome Extension E2E Tests

```text
E2E-001 Extension loads with no manifest error.
E2E-002 Popup opens with active tab URL.
E2E-003 Invalid configuration blocks start.
E2E-004 Valid crawl starts local fixture website.
E2E-005 Dashboard shows live counters.
E2E-006 Pause reaches safe paused state.
E2E-007 Resume continues remaining queue.
E2E-008 Cancel prevents new fetches.
E2E-009 Browser/service-worker interruption resumes correctly.
E2E-010 Completed crawl exports Markdown.
E2E-011 Completed crawl exports JSON and report.
E2E-012 Failed and skipped pages show reason codes.
E2E-013 Search UI returns section result.
E2E-014 QA UI returns source-backed passage.
E2E-015 Dashboard reload restores state.
E2E-016 Keyboard navigation reaches core controls.
E2E-017 Untrusted fixture text renders as text, not HTML.
```

Automated browser driving may be added later, but the repository must first provide reproducible manual E2E instructions because no external automation package is allowed.

---

# Part VIII — Reliability and Fault Injection

## 32. Restart and Interruption Tests

```text
RELIABILITY-001 Suspend worker before first task.
RELIABILITY-002 Suspend worker during queued state.
RELIABILITY-003 Suspend after fetch but before extraction commit.
RELIABILITY-004 Suspend after page storage but before completion transition.
RELIABILITY-005 Restart while paused.
RELIABILITY-006 Restart during finalization.
RELIABILITY-007 Duplicate alarm does not process task twice.
RELIABILITY-008 Expired operation lease is safely recovered.
RELIABILITY-009 Active operation lease prevents concurrent owner.
RELIABILITY-010 Completed page remains intact after interruption.
```

### Required Invariant

A page may be fetched again after an interruption if necessary, but it must never be falsely marked complete without a stored page record.

---

## 33. Corruption Tests

```text
CORRUPT-001 Missing optional field receives safe default.
CORRUPT-002 Missing required page ID rejects record.
CORRUPT-003 Invalid crawl state is reported.
CORRUPT-004 Posting referencing missing section is detected.
CORRUPT-005 Duplicate primary key does not silently overwrite unrelated record.
CORRUPT-006 Invalid schema version is rejected.
CORRUPT-007 Broken export snapshot fails validation.
CORRUPT-008 User can inspect failure rather than extension crashing.
```

---

# Part IX — Security and Privacy Tests

## 34. Security Tests

```text
SECURITY-001 Extracted script never executes.
SECURITY-002 Inline event handler never executes.
SECURITY-003 javascript: link is rejected.
SECURITY-004 data: link is rejected by crawl scope.
SECURITY-005 Outside-origin redirect is rejected.
SECURITY-006 Logout and delete links are not fetched.
SECURITY-007 Hostile HTML is displayed through textContent.
SECURITY-008 Stored XSS payload does not execute in dashboard.
SECURITY-009 Message payload with unexpected prototype fields is rejected or safely copied.
SECURITY-010 Unknown message sender cannot trigger restricted operation.
SECURITY-011 Export filename is sanitized.
SECURITY-012 Extension does not request unnecessary permissions.
SECURITY-013 Content is not sent to external network endpoints.
SECURITY-014 Search question remains local.
SECURITY-015 Archived content remains after no unintended telemetry request.
```

### 34.1 Network Privacy Inspection

For release testing, Chrome DevTools Network panel must confirm that:

- Requests go only to the user-approved documentation origin and extension-local resources.
- No analytics, hosted AI, telemetry, or third-party upload endpoint is contacted.

---

## 35. Permission Tests

```text
PERM-001 Manifest contains only documented permissions.
PERM-002 Optional host permission request matches selected origin.
PERM-003 Rejected permission leaves crawl unstarted.
PERM-004 Permission is not silently expanded to all sites.
PERM-005 Dashboard and popup work with extension-local permissions only.
```

---

# Part X — Performance Tests

## 36. Performance Measurement Rules

- Measure in a clean browser profile where practical.
- Record browser version and hardware class.
- Use local fixtures to remove network variability.
- Run each measurement multiple times.
- Report median and worst observed result.
- Do not mark arbitrary timing thresholds as universal; define release targets after baseline measurement.

## 37. Required Performance Scenarios

```text
PERF-001 Normalize 10,000 generated URLs.
PERF-002 Insert and remove 10,000 queue tasks.
PERF-003 Extract a large technical page.
PERF-004 Process a page with thousands of links.
PERF-005 Index 1,000 bounded sections.
PERF-006 Search a large local index.
PERF-007 Build Markdown archive from many pages.
PERF-008 Dashboard paginate large page list.
PERF-009 Resume from large persisted queue.
PERF-010 Boilerplate model remains bounded.
```

### 37.1 Required Metrics

- Duration.
- Peak or estimated retained memory where measurable.
- Long-task count.
- Number of DOM traversals.
- Number of storage transactions.
- Number of index writes.
- Queue size.
- Export size.

### 37.2 Performance Failure Rules

A performance test fails when:

- Work exceeds a documented hard safety limit.
- UI remains blocked long enough to break interaction requirements.
- Memory grows without returning after bounded work.
- An algorithm unexpectedly changes from intended complexity.
- Repeated runs accumulate duplicate storage or index records.

---

# Part XI — Accessibility and Usability Tests

## 38. Accessibility Checks

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

## 39. Usability Acceptance Tasks

A first-time user should be able to:

1. Install through Load Unpacked.
2. Open a documentation page.
3. Configure a bounded crawl.
4. Start and monitor the crawl.
5. Understand failed and skipped URLs.
6. Export Markdown.
7. Search the archive.
8. Ask a question and inspect the cited source.

Any step requiring undocumented developer knowledge is a release blocker.

---

# Part XII — Milestone Test Gates

## 40. M0 Gate — Foundation

Required:

- Manifest loads.
- Popup and dashboard open.
- Message smoke test passes.
- Local settings persist.
- Test harness itself passes self-tests.

## 41. M1 Gate — URL Safety

Required:

- All URL, scope, unsafe-action, and duplicate registry tests pass.
- No out-of-scope fixture enters queue.

## 42. M2 Gate — Queue and State

Required:

- Queue ordering and state matrix pass.
- Pause, resume, cancel, and restart integration tests pass.

## 43. M3 Gate — Fetch and Discovery

Required:

- Fetch classification tests pass.
- Redirect scope tests pass.
- Circular fixture does not create unbounded queue.

## 44. M4 Gate — Extraction

Required:

- Semantic fixtures preserve headings, lists, tables, and code.
- Navigation-heavy fixture selects correct root.
- Hostile markup does not execute.

## 45. M5 Gate — Export

Required:

- Golden Markdown and JSON match.
- Repeat export is byte-identical for stable snapshot.
- Archive validator passes valid fixture and rejects broken fixtures.

## 46. M6 Gate — Agent and Quality

Required:

- Quality bands calibrated against fixtures.
- Every controller decision branch tested.
- Recovery remains bounded.

## 47. M7 Gate — Search

Required:

- Search relevance fixture expectations pass.
- Stable ranking tests pass.
- Re-index tests pass.

## 48. M8 Gate — Question Answering

Required:

- Direct questions return sources.
- Unsupported questions return insufficient evidence.
- No generated unsupported statement appears.

## 49. M9 Gate — Release

Required:

- Full E2E lifecycle passes.
- Reliability, security, accessibility, and performance release tests pass.
- User installation and usage documentation has been followed from a clean profile.

---

# Part XIII — Coverage and Evidence

## 50. Coverage Policy

Because the first scratch harness may not provide statement instrumentation, coverage is tracked in two forms:

### 50.1 Requirement Coverage

Every functional and non-functional requirement must map to one or more test IDs.

### 50.2 Decision Coverage

Every documented decision branch must have at least one test:

- Accept.
- Reject.
- Retry.
- Skip.
- Fail.
- Cancel.
- Finalize.
- Insufficient evidence.

A module cannot be marked complete only because happy-path tests pass.

## 51. Traceability Matrix

Create and maintain:

```text
docs/TEST_TRACEABILITY_MATRIX.md
```

Suggested columns:

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

## 52. Required Test Evidence

For each milestone:

- Machine-readable test report.
- Human-readable summary.
- Failed test details.
- Browser and platform information for integration/E2E runs.
- Screenshots only where UI evidence is useful.
- Golden output diffs when exports change.
- Explanation for any skipped test.

---

# Part XIV — Defect Handling

## 53. Defect Severity

```text
Critical — unsafe fetch, data corruption, script execution, privacy leak.
High     — crawl cannot complete, resume fails, export invalid.
Medium   — feature incorrect with workaround.
Low      — minor UI, wording, or non-blocking issue.
```

## 54. Regression Requirement

Every fixed defect must add a regression test that:

1. Fails before the fix.
2. Passes after the fix.
3. Uses the smallest representative fixture.
4. Includes the linked issue or defect ID in its description.

---

# Part XV — Release Test Checklist

## 55. Automated Gate

- All required test suites pass.
- No unexplained skipped critical tests.
- Golden files reviewed.
- No unstable ordering failures.
- No unbounded retry or queue behavior.

## 56. Manual Gate

- Install in clean Chrome profile.
- Confirm permissions.
- Crawl basic local documentation site.
- Pause and resume.
- Interrupt and restore.
- Inspect failures.
- Export all supported formats.
- Search archive.
- Ask supported and unsupported questions.
- Confirm no external data upload.
- Confirm keyboard usability.

## 57. Version 1.0 Exit Criteria

Testing is complete for version 1.0 only when:

1. All milestone gates pass.
2. Every project requirement maps to a test.
3. Critical and high defects are closed.
4. No unsafe or out-of-scope request occurs in security fixtures.
5. Stable snapshots produce deterministic exports and search order.
6. Interruption cannot falsely complete or corrupt a page.
7. Search and QA stay local and source-backed.
8. A clean-profile manual acceptance run succeeds.
9. Test evidence is stored with the release.
10. Documentation matches actual test behavior and supported limits.
