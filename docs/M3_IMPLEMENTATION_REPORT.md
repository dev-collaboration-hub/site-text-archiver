# Site Text Archiver — M3 Implementation Report

## Status

**M3 — Page Fetching and Link Discovery is implemented in source with deterministic response classification, bounded fetching, scratch-built link discovery, persisted fetch metadata, IndexedDB HTML storage, M1 scope revalidation, retry scheduling, and Manifest V3 alarm-driven processing.**

Product completion after M3: **43%**.

Extension version: **0.4.0**.

Chrome load-unpacked/manual acceptance remains a separate browser check. M3 implementation and core logic were verified with local pure-module and mocked processing-loop tests; the repository browser test harness also contains M3 regression coverage.

## Implemented Source

```text
src/crawler/response-classifier.js
src/crawler/fetcher.js
src/crawler/link-discovery.js
src/crawler/fetch-record.js
src/crawler/network-crawler.js
src/storage/page-html-store.js
src/background/alarm-adapter.js
```

Updated integration files:

```text
src/background/runtime-controller.js
src/background/service-worker.js
src/crawler/crawl-run.js
src/crawler/progress-events.js
src/shared/constants.js
manifest.json
popup/popup.html
popup/popup.js
dashboard/dashboard.html
dashboard/dashboard.js
tests/index.html
```

Verification file:

```text
tests/unit/m3.test.js
```

## Delivered Capability

### Bounded fetching

- GET-only page fetching.
- Fetch timeout through `AbortController`.
- Cooperative active-fetch cancellation for Pause and Cancel.
- Redirect following with final URL revalidation.
- HTML content-type validation.
- Content-Length precheck where available.
- Actual downloaded HTML byte-limit enforcement.
- `Retry-After` parsing for rate limits.
- Structured network and HTTP reason codes.

### Response classification

Temporary/retryable responses include:

```text
408
425
429
5xx
network failures
timeouts
cooperative fetch cancellation
```

Permanent skip examples include:

```text
204 / 205
non-HTML 2xx responses
oversized HTML
404
401 / 403
unsupported 4xx responses
out-of-scope redirected URLs
```

### Scratch-built link discovery

The M3 scanner is implemented in plain JavaScript and does not use an npm HTML parser.

It:

- Parses start tags and attributes.
- Skips HTML comments.
- Avoids treating script/style text as links.
- Decodes common HTML entities in attributes.
- Reads the first valid `<base href>`.
- Detects `<link rel="canonical">`.
- Discovers `<a href>` and `<area href>` links.
- Resolves relative URLs.
- Removes exact resolved-link duplicates while keeping deterministic order.

### Safety integration

Every newly discovered link is sent through the existing M1 URL intelligence gate before queue insertion.

M1 still enforces:

- HTTP/HTTPS only.
- Exact allowed origin.
- Path-segment-aware allowed path.
- Include/exclude patterns.
- Blocked downloadable extensions.
- Unsafe action-link detection.
- Depth and page limits.
- Duplicate canonical URLs.

Redirect final URLs are revalidated before their HTML is accepted.

### Persistence

- Small fetch metadata records are stored in the persisted crawl snapshot.
- Raw fetched HTML is stored separately in browser IndexedDB rather than inside `chrome.storage.local`.
- The fetched HTML store is keyed by crawl ID and task ID so M4 semantic extraction can read the already-downloaded source.
- Active task state is persisted before network work starts, preserving M2 restart recovery behavior.

### Manifest V3 scheduling

The network loop processes one bounded task at a time.

```text
alarm fires
-> dequeue one approved task
-> persist FETCHING state
-> fetch and classify
-> store accepted HTML
-> discover links
-> M1 safety check
-> queue accepted links
-> persist result
-> schedule next alarm
```

This avoids depending on a permanently alive service worker.

### Host permissions

The extension does not automatically grant itself access to every website.

`manifest.json` declares optional HTTP/HTTPS host permissions. When the user presses **Create**, the popup requests permission only for the configured origin before a crawl is created.

## Progress Events

M3 adds events including:

```text
TASK_FETCHING
TASK_RETRY_SCHEDULED
PAGE_FETCHED
PAGE_SKIPPED
PAGE_FAILED
FINALIZATION_STARTED
CRAWL_COMPLETED
```

The dashboard displays fetched, queued, skipped, failed, and recent event state.

## Verification

Local execution verified:

- HTML response acceptance.
- Non-HTML rejection.
- 429 and Retry-After classification.
- Base URL resolution.
- Canonical URL extraction.
- Link deduplication.
- Entity decoding in URLs.
- Script-content false-link avoidance.
- Bounded fetch result handling.
- Mocked network-crawler fetch → store → discover → M1 approve → queue flow.

Repository regression tests additionally cover the same contracts through `tests/unit/m3.test.js`.

## Current Boundary

M3 downloads and stores approved HTML but does not yet convert it into semantic page content.

Successful network tasks end in `FETCHED`. M4 will read the stored HTML, clean the document, detect main content, preserve headings/lists/tables/code, and move the processing pipeline into extraction states.

## Next Target

**M4 — Semantic Content Extraction**.
