# Site Text Archiver — M4 Implementation Report

## Status

**M4 — Semantic Content Extraction is implemented in source and verified with dependency-free GitHub Actions plus repository regression tests.**

Product completion after M4: **58%**.

Extension version: **0.5.0**.

Chrome load-unpacked/manual acceptance remains tracked separately. M4 completion represents implemented parsing, cleanup, main-content selection, semantic block extraction, PageRecord creation, persistence, runtime state integration, and recovery behavior.

## Implemented Source

```text
src/extraction/dom-utils.js
src/extraction/html-parser.js
src/extraction/dom-cleaner.js
src/extraction/main-content-detector.js
src/extraction/content-extractor.js
src/extraction/page-record.js
src/extraction/extraction-pipeline.js
src/crawler/extraction-runner.js
src/storage/page-record-store.js
```

Updated integration files:

```text
src/storage/page-html-store.js
src/storage/crawl-store.js
src/crawler/crawl-run.js
src/crawler/progress-events.js
src/background/runtime-controller.js
src/background/service-worker.js
src/shared/constants.js
manifest.json
popup/popup.html
dashboard/dashboard.html
dashboard/dashboard.js
tests/index.html
```

Verification:

```text
tests/unit/m4.test.js
tests/node/m4-verify.mjs
.github/workflows/m4-verify.yml
```

## Scratch-Built Parsing

M4 does not use DOMParser, npm parsers, jsdom, Cheerio, Readability, or a hosted AI service.

The project now contains a plain-JavaScript inert HTML parser that builds a small internal AST. It handles:

- Start and end tags
- Quoted and unquoted attributes
- Common and numeric HTML entities
- Void elements
- Comments and doctypes
- Raw script/style text without executing it
- Malformed/unclosed markup with structured warnings

The parser never attaches untrusted page markup to extension UI documents and never executes page scripts.

## DOM Cleaning

Mandatory and unsafe extraction inputs are removed before scoring:

```text
script
style
noscript
template
iframe
object
embed
input
button
select
textarea
option
hidden nodes
aria-hidden=true nodes
inline display:none / visibility:hidden nodes
```

Known non-content UI tokens such as breadcrumbs, cookie UI, modal UI, and advertisements are conservatively removed.

Removal counts are retained as extraction evidence.

## Main-Content Detection

Candidate roots include:

- `main`
- `article`
- `role="main"`
- Content-like class and ID tokens
- `body` only as fallback

Scoring evidence includes:

- Text length
- Paragraph count
- Heading count
- Code-block count
- Table count
- Link density
- Navigation signals
- Semantic-root bonus
- Very-short-content penalty

Explicit semantic roots are preferred over the body fallback when usable. Low-confidence or short selections produce warnings rather than being silently treated as high-confidence content.

## Semantic Blocks

M4 preserves document order and supports:

```text
heading
paragraph
ordered-list
unordered-list
code-block
table
blockquote
callout
horizontal-rule
image-alt-text
```

### Headings

- Original heading level is preserved.
- Logical heading paths are tracked.
- Heading-level jumps are warned.
- Empty headings are ignored with warnings.

### Paragraphs and inline structure

- Paragraph text is preserved.
- Inline code is represented separately.
- Inline links preserve text and resolved URLs.

### Lists

- Ordered versus unordered type is preserved.
- Nested lists are represented as child list structures.
- Separate lists are not merged.

### Tables

- Header cells are retained.
- Row and column order is retained.
- Simple `rowspan` and `colspan` values are expanded into a rectangular grid.
- Conflicting or extreme spans produce `COMPLEX_TABLE_FALLBACK` warnings rather than silent corruption.

### Code

- Code whitespace is preserved.
- `language-*` and `lang-*` class hints are detected.
- Block code remains separate from inline code.

## Metadata and PageRecord

M4 captures:

- Title
- Description
- Author
- Document language
- Canonical link
- Source URL
- Heading records
- Semantic blocks
- Links
- Plain text
- Preliminary deterministic Markdown
- Extraction warnings and evidence

PageRecords include browser-native SHA-256 hashes for normalized content and semantic structure.

Quality scoring, cross-page boilerplate analysis, and exact/near duplicate classification remain intentionally unpopulated until M6.

## Persistence

Fetched HTML remains in the existing IndexedDB fetched-HTML store until extraction succeeds.

After semantic extraction:

1. The complete PageRecord is written to a separate IndexedDB page-record store.
2. A small page summary is persisted in the crawl snapshot for dashboard use.
3. The task transitions to `EXTRACTED`.
4. The fetched raw HTML record is deleted.

Raw HTML is therefore not copied into the PageRecord.

## Runtime Integration

The alarm-driven pipeline now behaves as:

```text
QUEUED
-> FETCHING
-> FETCHED
-> EXTRACTING
-> EXTRACTED
```

The runtime prioritizes pending `FETCHED` work for extraction before requesting another network-stage finalization.

If the Manifest V3 service worker is interrupted during extraction, restart repair converts the active `EXTRACTING` task back to `FETCHED` so extraction can safely restart from the persisted source HTML.

## Progress Events

M4 adds:

```text
PAGE_EXTRACTING
PAGE_EXTRACTED
PAGE_EXTRACTION_FAILED
```

The dashboard now displays extraction counts and extracted-page summaries.

## Verification

Repository browser tests cover:

- Script/style and hidden-node cleanup
- Main-root preference
- Heading hierarchy warnings
- Inline code and links
- Nested lists
- Code language hints and whitespace
- Table span normalization
- Callouts and metadata
- Deterministic PageRecord hashes
- No raw HTML field in PageRecord
- Persisted extraction state flow
- Raw-HTML cleanup after PageRecord persistence

A dependency-free Node 22 verification script executes the committed extraction modules in GitHub Actions with `--experimental-default-type=module` and no package installation.

The initial M4 verification workflow completed successfully on `main`.

## Deferred to M6

M4 deliberately does not claim completion of:

- Cross-page boilerplate-frequency analysis
- Exact and near duplicate-content classification
- 0–100 extraction quality scoring
- Quality-driven retry or rejection decisions

Those capabilities remain under M6 Offline Agent Controller and Quality System.

## Next Target

**M5 — Markdown and JSON Archive Generation**.
