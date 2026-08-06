# Site Text Archiver — Solo Implementation Plan

## 1. Purpose

This document defines how Site Text Archiver will be completed without a contributor workflow.

The project uses a single-owner execution model:

- **Product direction:** Dilip Singh
- **Implementation execution:** ChatGPT
- **Repository:** `dev-collaboration-hub/site-text-archiver`
- **Primary branch:** `main`
- **Build style:** scratch-built, milestone-by-milestone

ChatGPT is responsible for converting the approved documentation into working source code, tests, fixes, progress updates, and release artifacts.

## 2. What This Replaces

The current project does not require:

- Contributor onboarding
- Contribution guides
- Task assignment among developers
- Pull-request coordination between contributors
- External implementation ownership
- Contributor milestone allocation
- Waiting for volunteers

Issues or branches may still be used later when technically helpful, but they are not required to coordinate people.

## 3. Execution Responsibilities

### 3.1 Dilip Singh

Dilip Singh provides:

- Product vision
- Priority decisions
- Scope changes
- Feature acceptance or rejection
- Final direction when multiple product choices exist

### 3.2 ChatGPT

ChatGPT performs:

- Repository inspection
- Architecture refinement
- Documentation maintenance
- File and folder creation
- JavaScript, HTML, and CSS implementation
- Algorithm implementation
- Test-harness implementation
- Test fixture creation
- Debugging and correction
- Milestone verification
- Honest progress estimation
- README and release-document updates

## 4. Working Rules

1. Implement one milestone at a time.
2. Do not count documentation as working product code.
3. Do not mark placeholder files complete.
4. Keep core algorithms independent of Chrome APIs where practical.
5. Build without npm dependencies.
6. Use only browser-native and Chrome Extension APIs.
7. Store important runtime state because Manifest V3 workers can stop.
8. Add tests with each functional module.
9. Fix failures before claiming milestone completion.
10. Keep documentation synchronized with real behavior.
11. Report limitations honestly.
12. Avoid unnecessary architecture expansion before the basic crawler works.

## 5. Main Implementation Sequence

```text
Documentation foundation
-> M0 extension foundation
-> M1 URL intelligence
-> M2 queue and persisted state
-> M3 fetching and discovery
-> M4 semantic extraction
-> M5 archive export
-> M6 offline agent and quality
-> M7 local search
-> M8 extractive question answering
-> M9 dashboard and functional release
```

The documentation foundation is complete for the current approved scope. Implementation remains at the M0 foundation stage.

## 6. Milestone Execution Loop

For each milestone, ChatGPT follows this loop:

```text
Inspect current repository
-> compare implementation with specification
-> identify exact missing files
-> implement smallest complete slice
-> add or update tests
-> run available verification
-> inspect failures
-> fix failures
-> update documentation and progress
-> proceed to next slice
```

## 7. Definition of Done

A module is complete only when:

- Its intended files exist.
- Public functions match the documented contracts.
- Main behavior works.
- Invalid input is handled.
- Expected errors use reason codes.
- Relevant tests exist.
- Tests pass or unresolved failures are clearly disclosed.
- No unfinished placeholder is presented as complete.

A milestone is complete only when all of its required modules satisfy this definition.

## 8. Repository Write Policy

Current default workflow:

- Work directly against the repository's `main` branch.
- Use clear, scoped commit messages.
- Avoid unrelated file changes in one implementation step.
- Fetch the current file before replacing an existing file.
- Verify newly created or updated files after repository writes.
- Preserve stable documentation paths and contracts.

A temporary branch may be used for a risky large change, but contributor review is not assumed.

## 9. Testing Policy

Testing is part of implementation, not a separate contributor task.

ChatGPT must build and maintain:

- Scratch JavaScript test harness
- Pure unit tests
- Module contract tests
- IndexedDB integration tests
- Pipeline fixtures
- Local crawl-site fixtures
- Golden Markdown and JSON outputs
- Manual Chrome extension acceptance instructions

The current functional test scope is defined in `docs/TESTING_STRATEGY.md`.

M0 manual Chrome verification is defined in `docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md`.

Requirement-to-implementation and requirement-to-test mapping is maintained in `docs/REQUIREMENTS_TRACEABILITY.md`.

Security and privacy hardening remain deferred in `docs/DEFERRED_SECURITY_PRIVACY_WORK.md`.

## 10. Progress Reporting

Progress must distinguish:

```text
Documentation progress
Implementation progress
Automated test progress
Manual acceptance progress
Overall functional product progress
```

Current status:

```text
Documentation: 100% for the current approved scope
Implementation: M0 foundation committed
Automated tests: M0 pure-module smoke tests reported passing locally
Manual acceptance: M0 Chrome acceptance not yet recorded
Overall functional product: approximately 10%, early foundation stage
```

A high documentation percentage must never be presented as a high product-completion percentage.

## 11. Decision Handling

When a small technical choice is needed, ChatGPT should choose the option that is:

1. Simpler
2. Deterministic
3. Easier to test
4. Lower in memory and CPU cost
5. Compatible with Manifest V3 lifecycle constraints
6. Consistent with scratch-built development

Only major product-direction changes need to be raised to Dilip Singh.

## 12. No External Dependency Rule

The implementation must not depend on:

- npm packages
- External JavaScript libraries
- Hosted AI models
- Online LLM APIs
- Backend servers
- Cloud databases
- Remote analytics

Permitted foundations include:

- Standard JavaScript
- DOMParser
- URL API
- Fetch API
- IndexedDB
- Web Workers
- Chrome Extension APIs
- Browser-native Web Crypto

## 13. Current Implementation State

M0 source implementation now includes:

```text
manifest.json
LICENSE
src/background/service-worker.js
src/messaging/message-types.js
src/messaging/message-validator.js
src/messaging/runtime-client.js
src/shared/constants.js
src/shared/result.js
src/shared/id.js
src/storage/settings-store.js
popup/popup.html
popup/popup.css
popup/popup.js
dashboard/dashboard.html
dashboard/dashboard.css
dashboard/dashboard.js
tests/index.html
tests/test-runner.js
tests/assertions.js
tests/unit/index.test.js
```

The documentation control layer now includes:

```text
docs/DOCUMENTATION_INDEX.md
docs/REQUIREMENTS_TRACEABILITY.md
docs/M0_BROWSER_ACCEPTANCE_CHECKLIST.md
```

The next implementation target is **M1 — URL Intelligence and Safety**.

## 14. Completion Objective

The final objective is not to create work for contributors. The objective is to leave the repository with a functioning Chrome extension that can:

- Crawl bounded documentation sites
- Extract structured content
- Resume interrupted work
- Export Markdown and JSON
- Build a local search index
- Return source-backed extractive answers
- Provide a usable popup and dashboard
