# Site Text Archiver — Scratch Development Standard

## 1. Purpose

This standard defines what "built from scratch" means for Site Text Archiver.

The goal is not to avoid useful browser capabilities. The goal is to ensure that the project's crawler, extraction, quality, indexing, ranking, recovery, and question-answering intelligence is implemented and understood inside this repository.

## 2. Allowed Foundations

The project may use platform capabilities provided directly by modern JavaScript and Chrome, including:

- ECMAScript language features
- HTML and CSS
- Chrome Extension Manifest V3 APIs
- `fetch`
- `URL` and `URLSearchParams`
- `DOMParser`
- IndexedDB
- `chrome.storage`
- Web Workers
- Offscreen documents when required
- Web Crypto hashing primitives
- Browser download APIs
- Native regular expressions
- Native streams, encoders, and decoders

Using a platform primitive is not considered an external dependency.

## 3. Prohibited Runtime Dependencies

The production extension must not depend on:

- npm packages
- CDN-loaded libraries
- Browser-injected third-party scripts
- Backend servers
- Cloud databases
- Hosted crawler services
- Online language-model APIs
- External embedding APIs
- External vector databases
- Analytics or tracking SDKs

## 4. Algorithms That Must Be Implemented Locally

The repository must contain its own implementation of:

- URL canonicalization policy
- Scope validation
- Crawl task prioritization
- Duplicate URL prevention
- Main-content scoring
- Boilerplate detection
- Exact and near-duplicate content detection
- Extraction quality scoring
- Retry and recovery decisions
- Archive ordering
- Markdown generation
- Tokenization
- Section splitting
- Inverted indexing
- Search ranking
- Passage selection
- Extractive question answering
- Confidence and insufficient-evidence rules

## 5. No Fake AI Rule

A collection of fixed `if` statements must not be marketed as advanced intelligence without a documented decision model.

Every agent capability must specify:

1. Input data
2. Derived signals
3. Scoring or decision rule
4. Output
5. Failure condition
6. Test cases

The word "AI" in this project refers to locally implemented planning, ranking, classification, retrieval, quality evaluation, and bounded decision-making algorithms.

## 6. Deterministic-First Rule

The first version of every algorithm should be deterministic and explainable.

For example, a page-priority score may be defined as:

```text
priority =
  depthScore
  + navigationScore
  + documentationPatternScore
  + parentImportanceScore
  - retryPenalty
```

The implementation must document each signal and its range.

Randomness should not be used unless:

- It solves a defined problem.
- A seed can be supplied.
- Tests remain reproducible.

## 7. Pure-Core Rule

Business logic should be separated from browser integration.

Preferred design:

```text
Chrome event
  -> adapter
  -> pure input object
  -> pure algorithm
  -> pure output object
  -> adapter
  -> Chrome API or IndexedDB
```

This makes algorithms easier to test, benchmark, and reuse.

## 8. Dependency Direction

Allowed dependency direction:

```text
UI
 -> orchestration
 -> domain algorithms
 -> shared utilities
```

Browser adapters may depend on domain interfaces. Domain algorithms must not import popup or dashboard code.

The question-answering engine must not depend on UI components.

## 9. Module Contract Rule

Each important module must document:

- Responsibility
- Accepted input
- Returned output
- Error format
- Side effects
- Complexity expectations
- Storage interactions

Example:

```text
normalizeUrl(rawUrl, parentUrl, policy)

Input:
- rawUrl: string
- parentUrl: string
- policy: UrlPolicy

Output:
- ok: boolean
- normalizedUrl: string | null
- reasonCode: string | null
- warnings: string[]

Side effects:
- none
```

## 10. Error Handling Standard

Expected failures must be returned as structured results rather than hidden.

Recommended error record:

```text
- code
- stage
- message
- recoverable
- context
- timestamp
```

Errors must not contain archived private content unless necessary for local debugging.

## 11. Reason-Code Standard

Decisions should use stable codes, including:

```text
INVALID_URL
UNSUPPORTED_PROTOCOL
OUTSIDE_ORIGIN
OUTSIDE_PATH
EXCLUDED_PATTERN
BLOCKED_EXTENSION
UNSAFE_ACTION_LINK
DUPLICATE_URL
MAX_DEPTH_REACHED
MAX_PAGES_REACHED
FETCH_TIMEOUT
NON_HTML_RESPONSE
HTTP_CLIENT_ERROR
HTTP_SERVER_ERROR
RATE_LIMITED
EMPTY_EXTRACTION
LOW_CONTENT_QUALITY
EXACT_CONTENT_DUPLICATE
NEAR_CONTENT_DUPLICATE
RETRY_LIMIT_REACHED
INSUFFICIENT_EVIDENCE
```

User-facing text may change, but reason codes should remain stable.

## 12. Data Safety Standard

- Treat all crawled HTML as untrusted.
- Never execute extracted scripts.
- Never insert raw archived HTML into extension pages.
- Prefer `textContent` for UI output.
- Sanitize any limited HTML rendering.
- Do not collect cookies or credentials.
- Do not log authorization headers.
- Do not transmit page content externally.
- Require explicit user action before file export.

## 13. Crawl Safety Standard

The crawler must:

- Remain within the configured origin and path.
- Apply page and depth limits before queue insertion.
- Apply delay and concurrency limits.
- Stop after repeated global failures.
- Reject unsafe action links.
- Record why each page was skipped.
- Respect cancellation promptly.

The crawler must not:

- Attempt password guessing.
- Bypass access controls.
- Solve CAPTCHAs.
- Submit forms.
- Trigger purchases or account changes.
- Probe unrelated paths outside user-approved scope.

## 14. Performance-by-Construction Standard

Before optimizing micro-details, avoid expensive architecture.

Required practices:

- Do not store duplicate full-page representations unnecessarily.
- Avoid repeated normalization of the same URL.
- Avoid repeated hashing of unchanged content.
- Batch IndexedDB writes where safe.
- Bound queues and retry lists.
- Process large indexes incrementally.
- Avoid blocking the UI thread.
- Measure before adding complexity.

Every major algorithm should state expected complexity.

Examples:

```text
URL lookup: expected O(1) with Set or indexed storage
Queue insertion: O(log n) with binary heap
Exact duplicate lookup: expected O(1) by hash
Index lookup: O(number of query terms + postings visited)
```

## 15. Testing Without npm

Tests should run through a small repository-owned harness.

Possible execution targets:

- A browser test page
- Chrome extension test page
- Node.js only for pure ECMAScript modules, without installing packages

The test harness must support:

- Test registration
- Assertions
- Synchronous tests
- Asynchronous tests
- Pass/fail summary
- Non-zero exit status when run in Node and failures occur

## 16. Required Test Categories

### Unit Tests

For isolated algorithms such as normalization, filtering, scoring, hashing, tokenization, and ranking.

### Integration Tests

For module combinations such as fetch-to-extraction, page-to-index, and storage-to-export.

### Fixture Tests

HTML fixtures must represent:

- Clean documentation article
- Sidebar-heavy site
- Nested navigation
- Code-heavy page
- Table-heavy page
- Duplicate pages
- Empty page
- Malformed HTML
- Login-required page
- JavaScript-heavy shell

### Regression Tests

Every confirmed bug should receive a test before or with the fix.

## 17. Documentation-Implementation Synchronization

Documentation must describe existing behavior accurately.

When implementation differs from the design:

1. Decide whether code or design is correct.
2. Update the incorrect side.
3. Record major architectural changes in an Architecture Decision Record.

Planned features must be marked as planned, not presented as completed.

## 18. Architecture Decision Records

Major decisions should be documented under:

```text
docs/decisions/
```

Suggested format:

```text
# ADR-0001: Decision title

## Status
Accepted / Proposed / Superseded

## Context

## Decision

## Consequences

## Alternatives Considered
```

ADRs are required for changes such as:

- Storage engine changes
- Crawl execution model changes
- Major permission additions
- Ranking model replacement
- Introduction of any external dependency

## 19. Code Review Checklist

A contribution should not be merged unless reviewers can answer yes to the relevant checks:

- Is the responsibility clear?
- Is the algorithm locally implemented?
- Is external data transmission avoided?
- Are inputs validated?
- Are failure paths bounded?
- Are reason codes present?
- Is important state persisted safely?
- Are pure functions used where possible?
- Are tests included?
- Is documentation updated?
- Does the change remain inside crawl scope and safety rules?

## 20. Definition of Scratch Compliance

A feature is scratch-compliant when:

- Its core behavior is implemented inside the repository.
- It uses no prohibited runtime dependency.
- Its decision logic is documented.
- It can be tested independently.
- Its failures are explicit.
- Its performance is bounded.
- Its outputs can be traced back to inputs and rules.
