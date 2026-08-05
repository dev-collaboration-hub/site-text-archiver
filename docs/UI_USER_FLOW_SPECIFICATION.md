# Site Text Archiver — UI and User Flow Specification

## 1. Purpose

This document defines the complete user interface behavior for Site Text Archiver. It specifies popup screens, dashboard screens, navigation, controls, states, validation, progress visibility, errors, empty states, search, question answering, exports, accessibility, and completion criteria.

The interface must remain lightweight and understandable. It should expose useful crawl information without forcing users to understand crawler internals.

## 2. UI Principles

1. Show one primary action at a time.
2. Keep advanced settings optional and collapsed by default.
3. Never show a crawl as complete until finalization succeeds.
4. Show clear state labels instead of vague loading indicators.
5. Preserve user configuration after popup or dashboard reload.
6. Provide reason codes with readable explanations.
7. Keep destructive actions such as cancel visually distinct.
8. Avoid blocking the interface during crawling, indexing, or export.
9. Use deterministic ordering for lists and events.
10. Every screen must have useful loading, empty, success, and failure states.

---

# Part I — Main User Journey

## 3. Primary User Flow

```text
User opens a documentation page
-> opens extension popup
-> reviews detected start URL and path
-> optionally changes crawl limits
-> starts crawl
-> opens dashboard
-> monitors queued, completed, skipped, and failed pages
-> pauses or resumes if needed
-> crawl finalizes
-> user exports Markdown or JSON
-> user searches archive
-> user asks a local question
```

## 4. First-Use Flow

On first open:

1. Detect the active tab URL.
2. If the URL uses HTTP or HTTPS, prefill the start URL.
3. Suggest the current origin.
4. Suggest a path prefix based on the current directory.
5. Show a small explanation of maximum pages and depth.
6. Keep advanced settings collapsed.
7. Enable `Analyze Website` only after basic validation passes.

If the active tab is unsupported, show:

```text
Open a normal HTTP or HTTPS documentation page to begin.
```

The popup must not display a technical stack trace.

---

# Part II — Popup Specification

## 5. Popup Layout

Recommended width: `360–420px`.

Sections:

```text
Header
Detected page
Basic crawl settings
Advanced settings
Primary actions
Compact crawl status
Dashboard link
```

## 6. Popup Header

Contents:

- Product name: `Site Text Archiver`
- Small status indicator
- Optional current version

Status indicator values:

```text
Ready
Planning
Running
Paused
Finalizing
Completed
Failed
Cancelled
```

## 7. Detected Page Section

Fields:

```text
Start URL
Allowed origin
Allowed path prefix
```

Behavior:

- Start URL is editable.
- Origin is derived from the URL but can be confirmed by the user.
- Path prefix is editable.
- A reset button restores values from the active tab.
- Invalid URLs show inline field errors.

## 8. Basic Crawl Settings

Required controls:

```text
Maximum pages
Maximum depth
Request delay
Retry limit
```

Recommended defaults:

```text
Maximum pages: 100
Maximum depth: 5
Request delay: 500 ms
Retry limit: 2
```

Defaults are policy values and may change after testing.

## 9. Advanced Settings

Collapsed by default.

Controls:

```text
Include URL patterns
Exclude URL patterns
Remove known tracking parameters
Trailing-slash normalization mode
Maximum HTML size
Export options
```

Each setting must include a short explanation.

## 10. Popup Actions by State

### 10.1 IDLE

Primary:

```text
Analyze Website
```

Secondary:

```text
Open Dashboard
```

### 10.2 PLANNING

Primary action disabled.

Display:

```text
Analyzing website structure…
```

Allow:

```text
Cancel
```

### 10.3 READY

Primary:

```text
Start Crawl
```

Secondary:

```text
Review Plan
Edit Settings
```

### 10.4 RUNNING

Primary:

```text
Pause
```

Secondary:

```text
Open Dashboard
Cancel
```

Show compact progress:

```text
23 completed · 8 queued · 2 skipped
```

### 10.5 PAUSED

Primary:

```text
Resume
```

Secondary:

```text
Open Dashboard
Cancel
```

### 10.6 FINALIZING

Display:

```text
Building archive and index…
```

Disable configuration edits.

### 10.7 COMPLETED

Primary:

```text
Open Results
```

Secondary:

```text
Export Markdown
Start New Crawl
```

### 10.8 FAILED

Primary:

```text
View Failure
```

Secondary:

```text
Retry from Saved State
Start New Crawl
```

Retry is shown only when the failure is recoverable.

---

# Part III — Crawl Plan Review

## 11. Plan Review Screen

Shown after website analysis and before starting.

Display:

```text
Start URL
Allowed origin and path
Estimated discovered links
Configured page limit
Configured depth
Detected navigation sections
Excluded URL patterns
Warnings
```

Possible warnings:

```text
Very broad path selected
Start page contains few internal links
Website may rely heavily on JavaScript navigation
Page limit may stop before all discovered links are processed
```

Actions:

```text
Start Crawl
Edit Settings
Cancel Plan
```

No warning should silently change the user's configured scope.

---

# Part IV — Dashboard Information Architecture

## 12. Dashboard Navigation

Recommended tabs:

```text
Overview
Pages
Queue
Failures
Quality
Search
Ask
Exports
Events
Settings
```

The dashboard should remember the last selected tab per crawl.

## 13. Dashboard Header

Display:

- Crawl title derived from hostname or starting page.
- Crawl lifecycle state.
- Start time.
- Compact progress summary.
- Pause/resume/cancel controls when applicable.
- Export button after partial or complete crawl when supported.

## 14. Overview Tab

Summary cards:

```text
Discovered
Queued
Fetching
Completed
Skipped
Failed
Indexed sections
```

Additional panels:

```text
Current task
Recent activity
Crawl configuration
Quality summary
Warnings
```

## 15. Current Task Panel

Display:

```text
Current URL
Task state
Depth
Attempt number
Started time
Current phase
```

Current phases:

```text
Waiting
Fetching
Parsing
Extracting
Checking quality
Saving
Indexing
```

If no task is active:

```text
Waiting for the next queued page.
```

---

# Part V — Pages and Queue UI

## 16. Pages Tab

Columns:

```text
Title
URL
State
Depth
Quality score
Warnings
Fetched time
```

Filters:

```text
State
Quality band
Has warnings
Depth
Search by title or URL
```

Default order:

1. Archive order when completed.
2. Discovery order during active crawl.

Page row action:

```text
Inspect
Open source
View extracted text
View Markdown
```

## 17. Page Inspector

Sections:

```text
Metadata
Heading outline
Extracted blocks
Quality evidence
Warnings
Discovered links
Duplicate relations
Source URL
```

The inspector should show extracted text and generated Markdown in separate views.

## 18. Queue Tab

Columns:

```text
Priority
URL
Depth
Discovered from
Attempts
Reason for priority
Queue state
```

Controls:

```text
Filter by depth
Filter retries
Search URL
```

The first release should not allow arbitrary manual reordering unless the queue module explicitly supports it.

---

# Part VI — Failures, Skips, and Quality

## 19. Failures Tab

Columns:

```text
URL
Stage
Error code
Message
Recoverable
Attempt
Timestamp
```

Actions:

```text
Inspect
Retry page
Copy details
Open source
```

`Retry page` appears only when allowed by the state and retry policy.

## 20. Skipped Pages

Skipped pages may appear in a separate filter or subsection.

Show:

```text
URL
Reason code
Readable explanation
Discovered from
Depth
Timestamp
```

Examples:

```text
OUTSIDE_ORIGIN — Link points to another website.
OUTSIDE_PATH — Link is outside the selected documentation path.
ALREADY_QUEUED — This page is already waiting in the queue.
BLOCKED_EXTENSION — The link points to a non-HTML file.
MAX_DEPTH_REACHED — The configured crawl depth was reached.
```

## 21. Quality Tab

Summary:

```text
Strong pages
Acceptable pages
Weak pages
Failed extractions
Duplicate candidates
Boilerplate warnings
```

Table:

```text
Page
Overall score
Text score
Structure score
Code preservation
Table preservation
Duplicate score
Warnings
```

Quality evidence must be inspectable rather than represented only by a color.

---

# Part VII — Search and Question Answering

## 22. Search Tab

Controls:

```text
Search input
Page filter
Result limit
Clear
```

Result card:

```text
Page title
Heading path
Relevant snippet
Score or relevance label
Source URL
```

Search states:

```text
Empty — Enter a word or phrase to search the archive.
Loading — Searching local index…
No results — No matching section was found.
Results — Ranked source-linked sections.
Error — Search could not be completed.
```

## 23. Ask Tab

Input:

```text
Ask a question about the archived documentation
```

Output:

```text
Extracted answer passage
Confidence label
Page title
Heading path
Source URL
Additional supporting passages
```

Confidence labels:

```text
Strong evidence
Usable evidence
Insufficient evidence
```

When evidence is insufficient:

```text
The archive does not contain enough evidence to answer this question.
```

The UI must not present an unsupported generated answer.

---

# Part VIII — Export UI

## 24. Exports Tab

Available formats:

```text
documentation.md
documentation.json
crawl-report.json
failed-pages.json when applicable
```

Display:

```text
Archive status
Page count
Section count
Generated size
Validation status
Generated time
```

Actions:

```text
Generate export
Download
Regenerate
```

If a partial export is allowed, label it clearly:

```text
Partial archive — crawl not completed
```

## 25. Export Validation Failure

If final validation fails:

- Do not label export as complete.
- Show validation errors.
- Allow report download for debugging.
- Keep previously stored page records intact.

---

# Part IX — Events and Settings

## 26. Events Tab

Event columns:

```text
Time
Event type
URL or task
Reason code
Summary
```

Filters:

```text
Lifecycle
Fetch
Extraction
Quality
Recovery
Storage
Export
Search
QA
```

Event details may include structured evidence in a collapsible JSON-like viewer.

## 27. Settings Tab

Display the active configuration used for the crawl.

Editable only when allowed by lifecycle state.

Fields:

```text
Scope
Page and depth limits
Delay and retry policy
Include/exclude patterns
Normalization settings
Export settings
```

Changing settings for an active crawl must either:

1. Be rejected, or
2. Create a versioned configuration update supported by the runtime.

The first release should prefer rejecting unsafe mid-crawl changes.

---

# Part X — Confirmation Dialogs

## 28. Cancel Confirmation

Text:

```text
Cancel this crawl?
Completed pages will remain saved, but no new pages will be fetched.
```

Actions:

```text
Keep Crawling
Cancel Crawl
```

## 29. Start New Crawl Confirmation

If an active or saved crawl exists:

```text
Start a new crawl?
The existing crawl will remain in history unless deleted later.
```

## 30. Retry Failed Page Confirmation

Display:

```text
URL
Previous error
Current attempt count
Remaining retries
```

---

# Part XI — Error and Empty States

## 31. Error Presentation Rules

Every user-facing error should include:

```text
Short title
Readable explanation
Suggested next action
Optional technical details
Reason code
```

Example:

```text
Page could not be fetched
The website returned HTTP 500. The crawler can retry this page.
Reason: HTTP_SERVER_ERROR
```

## 32. Empty States

### No Crawl

```text
No crawl has been created yet.
Open a documentation page and start from the extension popup.
```

### No Completed Pages

```text
No page has completed extraction yet.
```

### No Failures

```text
No failed pages.
```

### No Search Index

```text
Search will become available after pages are indexed.
```

### No Events

```text
No events recorded for this crawl.
```

---

# Part XII — Loading and Refresh Behavior

## 33. Initial Loading

When the dashboard opens:

1. Show shell immediately.
2. Request crawl summary.
3. Render counters.
4. Load the selected tab data.
5. Subscribe to progress events.

Do not block the entire dashboard while loading one tab.

## 34. Live Updates

- Update summary counters from replay-safe progress events.
- Reconcile with persisted state periodically or after reconnect.
- Avoid duplicate rows when events are replayed.
- Use state version to ignore stale events.

## 35. Service Worker Restart

If connection is lost:

```text
Reconnecting to crawl state…
```

After reconnect:

- Reload persisted summary.
- Restore lifecycle state.
- Refresh current task.
- Keep the selected dashboard tab.

---

# Part XIII — Accessibility and Responsive Behavior

## 36. Accessibility Requirements

- Every input has a visible label.
- Every control is keyboard accessible.
- Focus order follows the visual workflow.
- Focus is moved to dialog headings when dialogs open.
- Errors are associated with the relevant field.
- Status is expressed in text, not only color.
- Tables use headers.
- Progress updates have an accessible summary.
- External source links have descriptive labels.
- Popup remains usable at browser zoom.

## 37. Keyboard Behavior

Recommended shortcuts inside dashboard:

```text
/       focus search in list-heavy tabs
Esc     close dialog or inspector
Enter   activate focused primary action
```

Shortcuts must not override text-entry behavior.

## 38. Responsive Behavior

Dashboard breakpoints:

```text
Wide: side navigation + content
Medium: compact side navigation
Narrow: top navigation or collapsible menu
```

Large data tables may switch to stacked cards on narrow layouts.

---

# Part XIV — Visual State Vocabulary

## 39. Lifecycle Labels

Use exact visible labels:

```text
Planning
Ready
Running
Pausing
Paused
Finalizing
Completed
Cancelled
Failed
```

## 40. Page State Labels

```text
Discovered
Queued
Fetching
Extracting
Validating
Completed
Skipped
Failed
Cancelled
```

## 41. Quality Labels

```text
Strong
Acceptable
Weak
Failed extraction
```

Do not use ambiguous labels such as `Good`, `Bad`, or `Done` without context.

---

# Part XV — UI Data Requirements

## 42. Summary Query

Dashboard overview requires:

```js
{
  crawlId,
  lifecycle,
  counts,
  currentTask,
  startedAt,
  updatedAt,
  warningCount,
  qualitySummary,
  indexSummary,
  exportSummary
}
```

## 43. Paginated List Query

```js
{
  items: [],
  nextCursor: null,
  totalCount: 0,
  stateVersion: 0
}
```

## 44. Inspector Query

The page inspector should request one complete page record and bounded related evidence rather than loading every related page.

---

# Part XVI — Completion Criteria

The UI specification is implemented only when:

1. Popup supports configuration, planning, start, pause, resume, cancel, and dashboard navigation.
2. Every lifecycle state has a defined visible representation.
3. Dashboard tabs load from persisted data.
4. Large page, queue, failure, and event lists are paginated.
5. Errors and skipped reasons are understandable.
6. Search returns section-level source-linked results.
7. Ask returns extractive evidence or insufficient evidence.
8. Exports show validation status.
9. Dashboard reconnects after service-worker restart.
10. Core workflows are keyboard accessible.
11. Empty and loading states are implemented.
12. No UI module contains crawler or extraction business logic.
13. State labels and reason codes match runtime contracts.
14. Manual E2E testing covers the full primary journey.
15. A first-time user can complete the workflow without reading source code.

## 45. Recommended UI Build Order

```text
Popup shell
-> configuration validation
-> popup lifecycle states
-> dashboard shell
-> overview counters
-> pages and queue lists
-> failures and quality views
-> pause/resume/cancel controls
-> exports
-> search
-> ask
-> event log
-> accessibility and responsive pass
```
