# Site Text Archiver — M1 Implementation Report

## Status

**M1 — URL Intelligence and Safety is implemented in source and verified with pure-module tests.**

Product completion after M1: **20%**.

The extension version is `0.2.0`. Browser installation acceptance for the extension shell remains tracked separately by `M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.

## Implemented Source

```text
src/crawler/query-policy.js
src/crawler/url-resolver.js
src/crawler/url-normalizer.js
src/crawler/blocked-extensions.js
src/crawler/link-safety.js
src/crawler/scope-guard.js
src/crawler/duplicate-url-registry.js
src/crawler/url-intelligence.js
```

Existing M0 files updated for M1 integration:

```text
src/storage/settings-store.js
src/shared/constants.js
src/background/service-worker.js
popup/popup.html
popup/popup.js
tests/index.html
tests/unit/index.test.js
```

Additional edge-case tests:

```text
tests/unit/m1-edge.test.js
```

## Delivered Capability

- Resolve relative and absolute HTTP/HTTPS URLs.
- Reject malformed and unsupported-protocol URLs with reason codes.
- Remove fragments.
- Normalize hostnames, default ports, duplicate path slashes, safe encoded path characters, and trailing slashes.
- Remove configured tracking parameters while retaining content-changing parameters.
- Sort retained query parameters deterministically.
- Produce a stable canonical URL key.
- Enforce exact origin boundaries.
- Enforce path-segment-aware path boundaries.
- Apply include and exclude glob patterns.
- Reject blocked downloadable file extensions.
- Detect unsafe account and transaction action links.
- Enforce page and depth limits.
- Detect already queued, visited, skipped, or completed canonical URLs.
- Return machine-readable decisions and evidence.
- Save include and exclude patterns through the extension popup.

## Public Entry Point

`inspectUrl(rawUrl, parentUrl, config, context)` performs the complete M1 pipeline:

```text
resolve
-> normalize
-> canonicalize
-> apply query policy
-> evaluate origin/path/pattern/safety/limit/duplicate rules
-> return an evidence-backed scope decision
```

No URL should be admitted by future crawl scheduling without passing this entry point or the equivalent `evaluateUrlScope()` guard.

## Reason Codes

Implemented rejection codes include:

```text
INVALID_URL
UNSUPPORTED_PROTOCOL
INVALID_SCOPE_CONFIG
OUTSIDE_ORIGIN
OUTSIDE_PATH
INCLUDE_PATTERN_MISS
EXCLUDED_PATTERN
BLOCKED_EXTENSION
UNSAFE_ACTION_LINK
MAX_DEPTH_REACHED
MAX_PAGE_LIMIT
DUPLICATE_URL
INVALID_CANONICAL_KEY
INVALID_DUPLICATE_STATE
URL_NOT_REGISTERED
```

Allowed URLs return `ALLOWED` with origin and path evidence.

## Verification

The M1 tests cover:

- Relative and absolute URL resolution
- Malformed URLs
- Unsupported protocols
- Fragment removal
- Default HTTPS port removal
- Hostname case normalization
- Duplicate slash normalization
- Safe encoded path normalization
- Unicode hostname normalization
- Query-parameter removal, retention, sorting, and repeated values
- Trailing slash equivalence
- Canonical-key equivalence
- Exact origin rejection
- Segment-aware path rejection
- Include and exclude patterns
- Blocked extensions
- Unsafe path and query actions
- Depth and page limits
- Duplicate canonical URLs
- Integrated resolve-to-scope classification

Core M1 behavior was also executed locally in a Node ES-module verification harness before repository writes.

## Boundary With M2 and M3

M1 provides URL decisions but does not create the crawl queue or fetch pages.

- M2 must use the M1 canonical key and duplicate registry when scheduling tasks.
- M3 must re-check redirected and discovered URLs through the M1 scope guard before fetching or queueing them.

## Next Target

**M2 — Crawl Queue and State Machine**.
