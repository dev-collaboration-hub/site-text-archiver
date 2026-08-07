# Site Text Archiver — M5 Implementation Report

## Status

**M5 — Markdown and JSON Archive Generation is implemented in source with deterministic PageRecord ordering, final Markdown conversion, structured JSON export, crawl/failure reports, and browser-native download integration.**

Product completion after M5: **68%**.

Extension version: **0.6.0**.

Dependency-free M5 verification passes in GitHub Actions. Chrome load-unpacked and real download acceptance remain separate manual browser checks.

## Implemented Source

```text
src/export/markdown-escape.js
src/export/code-fence.js
src/export/table-renderer.js
src/export/markdown-converter.js
src/export/page-ordering.js
src/export/toc-builder.js
src/export/report-generator.js
src/export/archive-builder.js
src/export/file-names.js
src/export/download-adapter.js
```

Updated integration:

```text
src/background/runtime-controller.js
src/background/service-worker.js
src/messaging/message-types.js
src/messaging/message-validator.js
src/shared/constants.js
manifest.json
dashboard/dashboard.html
dashboard/dashboard.js
tests/index.html
```

Verification:

```text
tests/unit/m5.test.js
tests/node/m5-verify.mjs
.github/workflows/m5-verify.yml
```

## Deterministic Page Ordering

Export ordering uses this stable policy:

1. Configured start page first.
2. Navigation sequence when available.
3. Lower crawl depth.
4. Earlier discovery sequence.
5. Canonical URL lexical order.
6. Page ID lexical tie-breaker.

The original IndexedDB query order is therefore not trusted as the archive order.

## Final Markdown Conversion

M5 renders semantic PageRecord blocks rather than copying preliminary M4 Markdown.

Implemented behavior includes:

- Archive-level title and crawl metadata.
- Stable table of contents.
- Unique duplicate-title TOC labels and anchors.
- Per-page source URL blocks.
- Combined-document heading normalization.
- Paragraph inline code and links.
- Nested ordered and unordered lists.
- Markdown tables with escaped pipes and flattened cell newlines.
- Code fences longer than any backtick run inside the code block.
- Blockquotes and callouts.
- Horizontal rules and useful image-alt text.
- No raw untrusted HTML injection.

## Structured JSON Archive

`documentation.json` contains:

- Archive build version.
- Crawl identity and source scope.
- Stable snapshot timestamp from persisted crawl state.
- TOC records.
- Explicit page order.
- Complete PageRecords.
- Final per-page Markdown.
- Extraction warning summary.

JSON object keys are recursively sorted before serialization so the same persisted crawl snapshot produces byte-stable JSON output.

## Reports

### Crawl report

`crawl-report.json` includes:

- Crawl ID and start URL.
- Scope and configured limits.
- Lifecycle and persisted timestamps.
- Task-state counts.
- Exported page count.
- Fetched byte total from FetchRecords.
- Retry totals.
- Stable reason-code summary.
- Extraction-warning count.
- Extension software version.

### Failed-page report

`failed-pages.json` is emitted only when failed/skipped tasks exist, unless an empty report is explicitly requested.

It preserves:

- Task and source URL.
- Parent URL.
- Final task state.
- Reason code.
- Attempt count.
- Depth and timestamps.

## Browser Download Integration

M5 adds the `downloads` extension permission and the runtime message:

```text
EXPORT_ARCHIVE
```

Request payload:

```js
{
  crawlId: "crawl_...",
  includeEmptyFailureReport: false
}
```

Export is rejected while a crawl is non-terminal with `CRAWL_NOT_STABLE_FOR_EXPORT`.

A terminal crawl with no PageRecords returns `EMPTY_ARCHIVE` rather than generating misleading empty files.

The service worker builds the archive from persisted crawl state and IndexedDB PageRecords, then uses `chrome.downloads.download()` for:

```text
documentation.md
documentation.json
crawl-report.json
failed-pages.json   // only when applicable
```

File-name sanitization removes path-traversal and invalid filename characters.

## Stable Snapshot Boundary

M5 does not refetch source pages during export.

The archive is built only from:

- Persisted terminal crawl snapshot.
- Persisted PageRecords.
- Persisted FetchRecords/task records used by reports.

Generation timestamps are derived from the persisted crawl snapshot rather than the current clock, preserving repeat-export determinism.

## Verification Results

Dependency-free Node/GitHub Actions verification covers:

- Same snapshot produces identical file bytes.
- Start-page-first ordering.
- Duplicate-title TOC anchor uniqueness.
- Source URL preservation.
- Heading normalization.
- Code fences expanding beyond embedded backtick runs.
- Table-pipe escaping.
- Crawl byte/retry report totals.
- Failed-page reason-code preservation.
- Filename path-traversal sanitization.
- Mocked `chrome.downloads` file generation.

The M5 GitHub Actions workflow completed successfully for the implementation verification commit.

## Manual Browser Boundary

Still not automatically proven in this environment:

- Chrome `Load unpacked` acceptance.
- Real IndexedDB → export → `chrome.downloads` end-to-end click flow.
- Browser behavior for very large archive download data URLs.

These remain explicit manual/reliability acceptance work and are not hidden by the automated M5 claim.

## Next Target

**M6 — Offline Agent Controller and Quality System**.
