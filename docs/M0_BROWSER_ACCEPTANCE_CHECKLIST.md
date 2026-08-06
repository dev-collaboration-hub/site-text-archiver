# Site Text Archiver — M0 Browser Acceptance Checklist

## 1. Purpose

This checklist defines the manual Chrome verification required before M0 can be marked fully accepted.

M0 source code and pure-module smoke tests may be complete while browser acceptance is still pending. This document keeps those states separate.

## 2. Test Environment Record

Record the following before testing:

```text
Date:
Tester:
Operating system:
Chrome version:
Repository commit SHA:
Extension version:
Fresh profile or existing profile:
```

## 3. Preparation

1. Fetch or download the repository at the commit being tested.
2. Open `chrome://extensions/`.
3. Enable **Developer mode**.
4. Remove any older loaded copy of Site Text Archiver.
5. Click **Load unpacked**.
6. Select the repository root containing `manifest.json`.
7. Open the extension service-worker inspection panel.
8. Keep the Console visible while completing the checks.

## 4. Installation Acceptance

Mark each item as PASS, FAIL, or BLOCKED.

| Check | Expected result | Result | Evidence or notes |
|---|---|---|---|
| Manifest loads | Chrome accepts the unpacked extension |  |  |
| Extension identity | Name and version match `manifest.json` |  |  |
| No manifest errors | Extension page shows no manifest warning that blocks operation |  |  |
| Service worker registers | Background service worker appears active or inspectable |  |  |
| No startup exception | Service-worker console has no uncaught startup error |  |  |

## 5. Popup Acceptance

Open an HTTP or HTTPS page before testing the popup.

| Check | Expected result | Result | Evidence or notes |
|---|---|---|---|
| Popup opens | Toolbar click renders the popup |  |  |
| Layout is usable | Controls are visible without overlap or clipping |  |  |
| Start URL detection | Current page URL is detected or can be entered |  |  |
| Origin derivation | Allowed origin matches the start URL origin |  |  |
| Path input | Allowed path can be entered and normalized |  |  |
| Limit controls | Page, depth, delay, and retry values are editable |  |  |
| Save succeeds | Valid settings produce a successful save state |  |  |
| Invalid URL rejected | Unsupported URL receives a clear error |  |  |
| Dashboard action | Dashboard opens from the popup |  |  |
| No popup exception | Popup DevTools shows no uncaught error |  |  |

## 6. Dashboard Acceptance

| Check | Expected result | Result | Evidence or notes |
|---|---|---|---|
| Dashboard opens | Extension dashboard renders in a tab |  |  |
| Runtime status | Dashboard can obtain the M0 runtime status |  |  |
| Saved settings visible | Dashboard displays or reflects saved configuration |  |  |
| M0 state is honest | UI does not claim crawling is implemented |  |  |
| No dashboard exception | Dashboard console has no uncaught error |  |  |

## 7. Persistence Acceptance

1. Save a distinctive valid configuration.
2. Close the popup and dashboard.
3. Restart Chrome completely.
4. Reopen the extension.

| Check | Expected result | Result | Evidence or notes |
|---|---|---|---|
| Settings survive popup close | Reopening the popup retains saved values |  |  |
| Settings survive Chrome restart | Saved values remain after a full browser restart |  |  |
| Runtime remains responsive | Ping/status requests still succeed after restart |  |  |
| No corrupted defaults | Restart does not replace valid settings unexpectedly |  |  |

## 8. Validation Boundary Checks

Use representative invalid and boundary values.

| Input | Expected result | Result | Notes |
|---|---|---|---|
| `file:///tmp/docs` start URL | Rejected as unsupported |  |  |
| Empty start URL | Rejected clearly |  |  |
| Page limit above maximum | Normalized to documented maximum or rejected consistently |  |  |
| Negative depth | Normalized to zero or rejected consistently |  |  |
| Path without leading slash | Normalized with leading slash |  |  |
| Repeated exclude pattern | Stored once |  |  |
| Empty exclude pattern | Removed |  |  |

## 9. Test Harness Acceptance

1. Open `tests/index.html` through an environment where JavaScript modules are permitted.
2. Run the scratch test harness.

| Check | Expected result | Result | Evidence or notes |
|---|---|---|---|
| Harness loads | Test page renders without module-load failure |  |  |
| Result tests pass | Shared success/failure contract tests pass |  |  |
| Identifier tests pass | Deterministic ID and invalid-prefix tests pass |  |  |
| Settings tests pass | Normalization and validation tests pass |  |  |
| Message tests pass | Valid and invalid message-contract tests pass |  |  |
| Final count shown | Harness reports total passed/failed tests |  |  |

## 10. Failure Recording

For each failure, record:

```text
Check:
Observed behavior:
Expected behavior:
Console error:
Reproduction steps:
Affected file or component:
Severity: blocking / major / minor
Resolution commit:
Retest result:
```

A blocking or major failure prevents M0 acceptance.

## 11. M0 Acceptance Decision

M0 may be marked **Verified** only when:

- Every installation check passes.
- Popup and dashboard open without uncaught errors.
- Valid settings save successfully.
- Invalid settings fail clearly.
- Settings persist after a full Chrome restart.
- The runtime remains responsive after service-worker lifecycle changes.
- The M0 smoke-test harness passes.
- Any blocking or major failures have been fixed and retested.

Decision record:

```text
M0 browser acceptance: PASS / FAIL / BLOCKED
Accepted commit SHA:
Acceptance date:
Known minor limitations:
Evidence location:
```

## 12. Current State

At the time this checklist was added:

```text
M0 source implementation: present
M0 pure-module smoke tests: reported passing locally
M0 Chrome browser acceptance: not yet recorded
```

This checklist completes the documentation required to perform and record that acceptance. It does not itself count as test evidence.
