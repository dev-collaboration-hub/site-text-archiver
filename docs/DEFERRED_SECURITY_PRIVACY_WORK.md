# Site Text Archiver — Deferred Security and Privacy Work

## 1. Status

**Current status:** Deferred

Security and privacy hardening are intentionally separated from the current implementation and testing scope. The immediate development focus is the functional archiver pipeline:

```text
Extension foundation
-> URL processing
-> crawl queue
-> page fetching
-> content extraction
-> local storage
-> Markdown and JSON export
-> local search
-> extractive question answering
```

This document preserves the future work so that it is not forgotten, while keeping current development focused and manageable.

## 2. Current Scope Decision

The current testing milestone will focus on:

- Functional correctness
- Deterministic behavior
- Crawl origin and path rules
- Queue limits
- Extraction quality
- Storage consistency
- Pause, resume, and restart recovery
- Export correctness
- Local search and question answering
- Performance and usability

Dedicated security and privacy verification is **not part of the current testing gate**.

## 3. Future Security Work

A later milestone should cover:

- Extension permission review
- Untrusted HTML handling
- Script and event-handler isolation
- Dashboard rendering safety
- Runtime message validation
- Sender and command authorization
- Redirect validation
- Dangerous action-link handling
- Stored-content injection testing
- Export filename validation
- Dependency and browser API review
- Failure behavior for malformed input

## 4. Future Privacy Work

A later milestone should cover:

- Network request inspection
- Confirmation that archived content is not uploaded unexpectedly
- Confirmation that local search questions remain local
- Telemetry and analytics review
- Stored-data lifecycle documentation
- User-controlled archive deletion
- Permission disclosure
- Export-data disclosure
- Sensitive documentation handling guidance
- Privacy-focused release checklist

## 5. Future Test Categories

Suggested future test folders:

```text
tests/security/
tests/privacy/
tests/permissions/
tests/hostile-input/
```

Suggested future test groups:

```text
SECURITY-*
PRIVACY-*
PERMISSION-*
HOSTILE-INPUT-*
```

## 6. Activation Point

This deferred work should be activated after the core archiver is working reliably and before the project is treated as production-ready for broad public use.

Recommended activation order:

```text
Core crawler and export complete
-> local search and QA complete
-> reliability testing complete
-> security hardening
-> privacy verification
-> public release review
```

## 7. Future Deliverables

When activated, create:

```text
docs/SECURITY_THREAT_MODEL.md
docs/PRIVACY_MODEL.md
docs/SECURITY_TESTING.md
docs/PERMISSION_REVIEW.md
docs/SECURITY_RELEASE_CHECKLIST.md
```

## 8. Completion Criteria for the Future Milestone

The future security and privacy milestone will be complete when:

1. Threats and trust boundaries are documented.
2. Extension permissions are justified.
3. Hostile HTML and stored-content cases are tested.
4. Runtime messages and restricted operations are validated.
5. Network behavior is inspected and documented.
6. Local-data behavior is explained to users.
7. Security and privacy regression tests exist.
8. A release checklist is completed.

## 9. Important Boundary

Deferring dedicated security and privacy testing does not mean removing the project’s core functional limits. Domain/path restrictions, bounded crawling, structured validation, and local-first architecture remain part of the main design because they are necessary for the archiver to function correctly.
