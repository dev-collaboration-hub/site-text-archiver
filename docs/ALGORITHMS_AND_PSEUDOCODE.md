# Site Text Archiver — Algorithms and Pseudocode

## 1. Purpose

This document defines the deterministic algorithms used by Site Text Archiver. It translates the module contracts into implementation-ready logic with inputs, outputs, invariants, pseudocode, complexity targets, failure behavior, and test requirements.

The project is built from scratch with plain JavaScript and browser-native APIs. The algorithms in this document must not depend on npm packages, cloud services, hosted language models, external AI APIs, or a backend server.

## 2. Algorithm Design Principles

Every algorithm must follow these rules:

1. **Deterministic:** unchanged inputs must produce unchanged outputs.
2. **Bounded:** loops, retries, queue sizes, page counts, and passage sizes must have explicit limits.
3. **Explainable:** decisions must include reason codes and evidence.
4. **Safe by default:** uncertain URLs and unsafe actions must be rejected rather than guessed safe.
5. **Pure where possible:** core logic should not directly call Chrome APIs or IndexedDB.
6. **Incremental:** large crawls must be processed page by page rather than held fully in memory.
7. **Stable ordering:** equal-score items must use deterministic tie-breakers.
8. **Local-first:** archived content and user questions remain on-device.
9. **No silent failure:** malformed input must produce a structured error or warning.
10. **Versioned behavior:** scoring weights and normalization rules must expose a version number.

## 3. Pseudocode Conventions

```text
FUNCTION name(arguments)
    ...
    RETURN value
END FUNCTION
```

Collections:

```text
LIST       ordered collection
SET        unique values
MAP        key-value collection
PRIORITY_QUEUE stable ordered task collection
```

Structured result:

```text
SUCCESS(value, warnings = [])
FAILURE(code, message, recoverable = false, details = {})
```

Complexity notation:

- `n`: number of characters or tokens in one page.
- `e`: number of DOM elements in one page.
- `l`: number of links in one page.
- `p`: number of stored pages.
- `s`: number of sections.
- `q`: number of query tokens.
- `k`: requested top results.

---

# Part I — URL Intelligence and Crawl Safety

## 4. URL Resolution and Canonicalization

### 4.1 Goal

Convert a raw discovered link into a stable canonical URL used for scope checking and duplicate detection.

### 4.2 Inputs

```text
rawUrl
parentUrl
normalizationPolicy
```

### 4.3 Output

```js
{
  canonicalUrl,
  displayUrl,
  transformations: [],
  removedParameters: [],
  warnings: []
}
```

### 4.4 Canonicalization Rules

1. Resolve relative URLs against the parent URL.
2. Accept only `http:` and `https:`.
3. Lowercase scheme and hostname.
4. Remove fragments.
5. Remove default ports: `80` for HTTP and `443` for HTTPS.
6. Collapse `.` and `..` path segments through the browser URL parser.
7. Replace duplicate path slashes, except the protocol separator.
8. Apply a deterministic trailing-slash policy.
9. Remove configured tracking parameters.
10. Sort retained query parameters by key and then value.
11. Preserve parameters that may identify real documentation pages unless explicitly blocked.
12. Serialize with a stable format.

### 4.5 Pseudocode

```text
FUNCTION normalizeUrl(rawUrl, parentUrl, policy)
    IF rawUrl is not a non-empty string
        RETURN FAILURE("INVALID_URL", "URL must be a non-empty string")
    END IF

    TRY
        parsed = NEW URL(rawUrl, parentUrl)
    CATCH
        RETURN FAILURE("MALFORMED_URL", "URL could not be parsed")
    END TRY

    IF parsed.protocol NOT IN {"http:", "https:"}
        RETURN FAILURE("UNSUPPORTED_PROTOCOL", "Only HTTP and HTTPS are supported")
    END IF

    transformations = EMPTY LIST
    removedParameters = EMPTY LIST

    parsed.protocol = LOWERCASE(parsed.protocol)
    parsed.hostname = LOWERCASE(parsed.hostname)
    parsed.hash = ""

    IF parsed.protocol == "http:" AND parsed.port == "80"
        parsed.port = ""
        APPEND "REMOVED_DEFAULT_PORT" TO transformations
    END IF

    IF parsed.protocol == "https:" AND parsed.port == "443"
        parsed.port = ""
        APPEND "REMOVED_DEFAULT_PORT" TO transformations
    END IF

    path = normalizePath(parsed.pathname, policy.trailingSlashMode)
    parsed.pathname = path

    retained = EMPTY LIST
    FOR EACH (key, value) IN parsed.searchParams
        normalizedKey = LOWERCASE(TRIM(key))

        IF isTrackingParameter(normalizedKey, policy)
            APPEND key TO removedParameters
        ELSE
            APPEND (key, value) TO retained
        END IF
    END FOR

    SORT retained BY key ascending, THEN value ascending
    parsed.search = ""

    FOR EACH (key, value) IN retained
        parsed.searchParams.append(key, value)
    END FOR

    canonicalUrl = parsed.toString()

    RETURN SUCCESS({
        canonicalUrl,
        displayUrl: canonicalUrl,
        transformations,
        removedParameters,
        warnings: []
    })
END FUNCTION
```

### 4.6 Path Normalization

```text
FUNCTION normalizePath(pathname, trailingSlashMode)
    path = REPLACE repeated "/" with one "/"

    IF path is empty
        path = "/"
    END IF

    IF trailingSlashMode == "REMOVE_EXCEPT_ROOT"
        IF path != "/" AND path ends with "/"
            path = REMOVE final "/"
        END IF
    ELSE IF trailingSlashMode == "PRESERVE"
        // no change
    END IF

    RETURN path
END FUNCTION
```

### 4.7 Complexity

- Time: `O(length of URL + number of query parameters log parameters)`.
- Space: `O(number of query parameters)`.

### 4.8 Required Tests

- Relative URLs.
- Protocol-relative URLs.
- Fragments.
- Default ports.
- Duplicate slashes.
- Dot path segments.
- Query ordering.
- Tracking parameter removal.
- Encoded paths.
- Root and non-root trailing slashes.
- Invalid and unsupported protocols.

---

## 5. Tracking Parameter Detection

### 5.1 Default Removable Parameters

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
gclid
fbclid
mc_cid
mc_eid
```

### 5.2 Pseudocode

```text
FUNCTION isTrackingParameter(key, policy)
    normalized = LOWERCASE(key)

    IF normalized IN policy.explicitKeepParameters
        RETURN false
    END IF

    IF normalized IN policy.explicitRemoveParameters
        RETURN true
    END IF

    IF normalized starts with "utm_"
        RETURN true
    END IF

    RETURN normalized IN DEFAULT_TRACKING_PARAMETERS
END FUNCTION
```

The system must not remove arbitrary query parameters merely because they look unimportant. Parameters may select documentation versions, languages, sections, or rendered views.

---

## 6. Scope Guard

### 6.1 Goal

Determine whether a normalized URL is permitted to enter the crawl queue.

### 6.2 Decision Order

The order is significant and must remain stable:

1. Supported scheme.
2. Allowed origin.
3. Allowed path prefix.
4. Unsafe account-action detection.
5. Blocked file extension.
6. Exclusion patterns.
7. Inclusion patterns.
8. Maximum depth.
9. Maximum page count.
10. Duplicate state.

### 6.3 Pseudocode

```text
FUNCTION evaluateScope(candidate, config, crawlState)
    parsed = NEW URL(candidate.canonicalUrl)

    IF parsed.protocol NOT IN {"http:", "https:"}
        RETURN REJECT("UNSUPPORTED_PROTOCOL")
    END IF

    IF parsed.origin != config.allowedOrigin
        RETURN REJECT("OUTSIDE_ORIGIN")
    END IF

    IF NOT pathIsInside(parsed.pathname, config.allowedPathPrefix)
        RETURN REJECT("OUTSIDE_PATH")
    END IF

    unsafeResult = detectUnsafeAction(candidate.canonicalUrl)
    IF unsafeResult.isUnsafe
        RETURN REJECT("UNSAFE_ACTION_LINK", unsafeResult.evidence)
    END IF

    extension = getLowercaseFileExtension(parsed.pathname)
    IF extension IN config.blockedExtensions
        RETURN REJECT("BLOCKED_EXTENSION", { extension })
    END IF

    IF matchesAny(candidate.canonicalUrl, config.excludePatterns)
        RETURN REJECT("EXCLUDED_BY_PATTERN")
    END IF

    IF config.includePatterns is not empty AND
       NOT matchesAny(candidate.canonicalUrl, config.includePatterns)
        RETURN REJECT("NOT_INCLUDED_BY_PATTERN")
    END IF

    IF candidate.depth > config.maxDepth
        RETURN REJECT("MAX_DEPTH_REACHED")
    END IF

    IF crawlState.acceptedPageCount + crawlState.reservedTaskCount >= config.maxPages
        RETURN REJECT("MAX_PAGE_LIMIT_REACHED")
    END IF

    IF candidate.canonicalUrl IN crawlState.visitedUrls
        RETURN REJECT("ALREADY_VISITED")
    END IF

    IF candidate.canonicalUrl IN crawlState.queuedUrls
        RETURN REJECT("ALREADY_QUEUED")
    END IF

    RETURN ACCEPT("URL_ALLOWED")
END FUNCTION
```

### 6.4 Safe Path Prefix Comparison

A naive string prefix check can incorrectly treat `/docs-old` as inside `/docs`.

```text
FUNCTION pathIsInside(candidatePath, allowedPrefix)
    prefix = normalizeAllowedPrefix(allowedPrefix)

    IF prefix == "/"
        RETURN true
    END IF

    IF candidatePath == prefix
        RETURN true
    END IF

    RETURN candidatePath starts with prefix + "/"
END FUNCTION
```

### 6.5 Complexity

- Time: `O(number of configured patterns × URL length)` in the simple implementation.
- Space: `O(1)` excluding stored URL sets.

---

## 7. Unsafe Action-Link Detection

### 7.1 Goal

Reject links that may trigger account or destructive actions.

### 7.2 Signals

- Path segments such as `logout`, `signout`, `delete`, `remove-account`, `unsubscribe`, `purchase`, `checkout`, `billing`, `revoke`, `reset-password`.
- Query keys such as `action=delete`.
- Link labels such as “Delete account” when available.
- Known non-navigation schemes are already rejected by the protocol check.

### 7.3 Pseudocode

```text
FUNCTION detectUnsafeAction(url, optionalLabel = "")
    parsed = NEW URL(url)
    pathTokens = tokenizeUrlComponent(parsed.pathname)
    queryTokens = EMPTY LIST

    FOR EACH (key, value) IN parsed.searchParams
        APPEND LOWERCASE(key) TO queryTokens
        APPEND LOWERCASE(value) TO queryTokens
    END FOR

    labelTokens = tokenizeText(optionalLabel)
    allTokens = CONCAT(pathTokens, queryTokens, labelTokens)

    matches = INTERSECTION(allTokens, UNSAFE_ACTION_TOKENS)

    IF matches is not empty
        RETURN {
            isUnsafe: true,
            evidence: { matchedTokens: SORT(matches) }
        }
    END IF

    RETURN { isUnsafe: false, evidence: {} }
END FUNCTION
```

This detector must prefer false positives over performing a potentially unsafe request. Rejected URLs remain visible in the skipped-page report.

---

# Part II — Planning, Queueing, and Crawl State

## 8. Crawl Priority Scoring

### 8.1 Goal

Assign a transparent score to each allowed URL. Higher scores run earlier.

### 8.2 Recommended Signals

```text
+40  start page
+20  navigation link
+15  URL contains documentation keyword
+10  heading or sidebar link
+8   same parent section as current page
+5   shallow depth
+0..5 earlier link position
-10  retry task
-15  marketing vocabulary
-20  calendar, tag, author, feed, or changelog pagination noise
```

Weights must be stored in a versioned configuration object rather than scattered through code.

### 8.3 Pseudocode

```text
FUNCTION scoreCrawlCandidate(candidate, context, weights)
    components = EMPTY MAP

    components.startPage = candidate.isStartPage ? weights.startPage : 0
    components.navigation = candidate.isNavigationLink ? weights.navigation : 0
    components.documentationKeyword =
        containsDocumentationKeyword(candidate.url, candidate.label)
        ? weights.documentationKeyword
        : 0
    components.semanticPlacement =
        candidate.placement IN {"heading", "sidebar"}
        ? weights.semanticPlacement
        : 0
    components.sameSection =
        candidate.sectionKey == context.currentSectionKey
        ? weights.sameSection
        : 0
    components.depth = MAX(0, weights.maxDepthBonus - candidate.depth)
    components.linkOrder = normalizedOrderBonus(candidate.linkOrder, candidate.siblingCount)
    components.retryPenalty = candidate.attempts * weights.retryPenalty
    components.marketingPenalty =
        containsMarketingVocabulary(candidate.url, candidate.label)
        ? weights.marketingPenalty
        : 0
    components.noisePenalty =
        looksLikeArchiveNoise(candidate.url)
        ? weights.noisePenalty
        : 0

    score = SUM(values of components)

    RETURN {
        score,
        components,
        policyVersion: weights.version
    }
END FUNCTION
```

### 8.4 Stable Tie-Breaking

Equal scores are ordered by:

1. Lower depth.
2. Earlier discovery sequence.
3. Lexicographically smaller canonical URL.
4. Task ID.

---

## 9. Stable Priority Queue

### 9.1 Data Structure

Use a binary heap plus a URL membership set.

Task comparison:

```text
higher priority score first
lower depth first
earlier discovery sequence first
canonical URL ascending
task ID ascending
```

### 9.2 Pseudocode

```text
FUNCTION compareTasks(a, b)
    IF a.priorityScore != b.priorityScore
        RETURN a.priorityScore > b.priorityScore
    END IF

    IF a.depth != b.depth
        RETURN a.depth < b.depth
    END IF

    IF a.discoverySequence != b.discoverySequence
        RETURN a.discoverySequence < b.discoverySequence
    END IF

    IF a.canonicalUrl != b.canonicalUrl
        RETURN a.canonicalUrl < b.canonicalUrl
    END IF

    RETURN a.taskId < b.taskId
END FUNCTION
```

```text
FUNCTION enqueue(queue, membershipSet, task, maxSize)
    IF task.canonicalUrl IN membershipSet
        RETURN FAILURE("DUPLICATE_TASK", "URL is already queued")
    END IF

    IF queue.size >= maxSize
        RETURN FAILURE("QUEUE_LIMIT_REACHED", "Queue capacity reached")
    END IF

    APPEND task TO queue.heap
    ADD task.canonicalUrl TO membershipSet
    siftUp(queue.heap, queue.size - 1)

    RETURN SUCCESS(task)
END FUNCTION
```

```text
FUNCTION dequeue(queue, membershipSet)
    IF queue.size == 0
        RETURN SUCCESS(null)
    END IF

    top = queue.heap[0]
    last = REMOVE LAST item from queue.heap
    REMOVE top.canonicalUrl FROM membershipSet

    IF queue.size > 0
        queue.heap[0] = last
        siftDown(queue.heap, 0)
    END IF

    RETURN SUCCESS(top)
END FUNCTION
```

### 9.3 Complexity

- Enqueue: `O(log taskCount)`.
- Dequeue: `O(log taskCount)`.
- Membership check: expected `O(1)`.
- Space: `O(taskCount)`.

---

## 10. Crawl State Transition Algorithm

### 10.1 Transition Table

```text
IDLE        + CREATE          -> PLANNING
PLANNING    + PLAN_READY      -> READY
READY       + START           -> RUNNING
RUNNING     + PAUSE           -> PAUSING
PAUSING     + SAFE_POINT      -> PAUSED
PAUSED      + RESUME          -> RUNNING
RUNNING     + QUEUE_EMPTY     -> FINALIZING
FINALIZING  + VALIDATION_OK   -> COMPLETED
Any non-terminal + CANCEL     -> CANCELLED
Any non-terminal + FATAL      -> FAILED
```

### 10.2 Pseudocode

```text
FUNCTION transitionCrawl(currentState, event, transitionTable)
    IF currentState IN {"COMPLETED", "CANCELLED", "FAILED"}
        RETURN FAILURE("TERMINAL_STATE_LOCKED", "Terminal state cannot transition")
    END IF

    key = currentState + ":" + event.type

    IF key NOT IN transitionTable
        RETURN FAILURE("INVALID_TRANSITION", "Transition is not allowed", false, {
            currentState,
            eventType: event.type
        })
    END IF

    nextState = transitionTable[key]

    RETURN SUCCESS({
        previousState: currentState,
        nextState,
        eventType: event.type,
        changedAt: event.timestamp
    })
END FUNCTION
```

Persistence must happen before the runtime reports the transition as successful.

---

## 11. Crawl Loop

### 11.1 Pseudocode

```text
FUNCTION runOneCrawlStep(crawlId)
    state = storage.loadCrawlState(crawlId)

    IF state.lifecycle != "RUNNING"
        RETURN SUCCESS({ action: "NO_WORK", state: state.lifecycle })
    END IF

    IF state.cancelRequested
        persistTransition(crawlId, "CANCEL")
        RETURN SUCCESS({ action: "CANCELLED" })
    END IF

    task = queue.dequeue(crawlId)

    IF task is null
        persistTransition(crawlId, "QUEUE_EMPTY")
        scheduleFinalization(crawlId)
        RETURN SUCCESS({ action: "FINALIZING" })
    END IF

    persistTaskState(task.taskId, "FETCHING")
    fetchResult = fetchPage(task, state.config)

    IF fetchResult.ok == false
        decision = recoveryManager.decide(task, fetchResult.error, state.config)
        applyAgentDecision(crawlId, task, decision)
        RETURN SUCCESS(decision)
    END IF

    extractionResult = extractPage(fetchResult.value, task)

    IF extractionResult.ok == false
        decision = recoveryManager.decide(task, extractionResult.error, state.config)
        applyAgentDecision(crawlId, task, decision)
        RETURN SUCCESS(decision)
    END IF

    quality = evaluatePageQuality(extractionResult.value, state.qualityPolicy)
    decision = agentController.decide({ task, extractionResult, quality, state })
    applyAgentDecision(crawlId, task, decision)

    RETURN SUCCESS(decision)
END FUNCTION
```

Only one state-changing owner may process a crawl at a time. A persisted lease or operation token should prevent duplicate concurrent crawl steps after service-worker restarts.

---

# Part III — Fetching and Link Discovery

## 12. Controlled Fetch Algorithm

### 12.1 Rules

- Fetch only after scope approval.
- Apply configured delay.
- Use an abort timeout.
- Reject non-HTML content.
- Record redirects and validate the final URL again.
- Classify recoverability.

### 12.2 Pseudocode

```text
ASYNC FUNCTION fetchPage(task, config)
    WAIT until requestDelayPolicy allows task.origin

    controller = NEW AbortController()
    timeoutId = SET_TIMEOUT(() => controller.abort(), config.fetchTimeoutMs)

    TRY
        response = AWAIT fetch(task.canonicalUrl, {
            method: "GET",
            credentials: "include",
            redirect: "follow",
            signal: controller.signal,
            headers: { "Accept": "text/html,application/xhtml+xml" }
        })
    CATCH error
        CLEAR_TIMEOUT(timeoutId)

        IF error indicates abort
            RETURN FAILURE("FETCH_TIMEOUT", "Page request timed out", true)
        END IF

        RETURN FAILURE("NETWORK_ERROR", "Page request failed", true, serializeError(error))
    END TRY

    CLEAR_TIMEOUT(timeoutId)

    finalUrlResult = normalizeUrl(response.url, task.canonicalUrl, config.urlPolicy)
    IF finalUrlResult.ok == false
        RETURN finalUrlResult
    END IF

    finalScope = evaluateScope(finalUrlResult.value, config, emptyDuplicateContext())
    IF finalScope.allowed == false
        RETURN FAILURE("REDIRECT_OUT_OF_SCOPE", "Redirect left the allowed scope")
    END IF

    statusClass = classifyHttpStatus(response.status)
    IF statusClass.accept == false
        RETURN FAILURE(statusClass.code, statusClass.message, statusClass.recoverable, {
            status: response.status
        })
    END IF

    contentType = LOWERCASE(response.headers.get("content-type") OR "")
    IF NOT contentType includes "text/html" AND
       NOT contentType includes "application/xhtml+xml"
        RETURN FAILURE("NON_HTML_RESPONSE", "Response is not HTML", false, { contentType })
    END IF

    html = AWAIT response.text()

    IF html.length > config.maxHtmlBytes
        RETURN FAILURE("HTML_SIZE_LIMIT", "HTML exceeds configured size limit")
    END IF

    RETURN SUCCESS({
        requestedUrl: task.canonicalUrl,
        finalUrl: finalUrlResult.value.canonicalUrl,
        status: response.status,
        contentType,
        html,
        fetchedAt: CURRENT_TIME()
    })
END FUNCTION
```

### 12.3 HTTP Classification

```text
200..299  accept
301..399  handled by redirect validation
404, 410  permanent failure
401, 403  permanent access failure
408       recoverable
425       recoverable
429       recoverable after delay
500..599  recoverable within retry limit
other     permanent unless explicitly classified
```

---

## 13. Link Discovery

### 13.1 Pseudocode

```text
FUNCTION discoverLinks(document, pageUrl, config, parentDepth)
    anchors = document.querySelectorAll("a[href]")
    candidatesByUrl = EMPTY MAP
    sequence = 0

    FOR EACH anchor IN anchors
        sequence = sequence + 1
        rawHref = anchor.getAttribute("href")
        label = normalizeWhitespace(anchor.textContent)

        normalized = normalizeUrl(rawHref, pageUrl, config.urlPolicy)
        IF normalized.ok == false
            RECORD skipped candidate with normalized.error.code
            CONTINUE
        END IF

        candidate = {
            canonicalUrl: normalized.value.canonicalUrl,
            discoveredFrom: pageUrl,
            depth: parentDepth + 1,
            label,
            linkOrder: sequence,
            placement: detectLinkPlacement(anchor)
        }

        scope = evaluateScope(candidate, config, currentDuplicateContext())
        IF scope.allowed == false
            RECORD skipped candidate with scope.reasonCode
            CONTINUE
        END IF

        IF candidate.canonicalUrl NOT IN candidatesByUrl
            candidatesByUrl[candidate.canonicalUrl] = candidate
        ELSE
            candidatesByUrl[candidate.canonicalUrl] = mergeCandidateEvidence(
                candidatesByUrl[candidate.canonicalUrl],
                candidate
            )
        END IF
    END FOR

    candidates = VALUES(candidatesByUrl)

    FOR EACH candidate IN candidates
        candidate.priority = scoreCrawlCandidate(candidate, page context, config.priorityPolicy)
    END FOR

    SORT candidates using stable task comparator
    RETURN SUCCESS(candidates)
END FUNCTION
```

### 13.2 Complexity

- Time: `O(l × normalizationCost + l log l)`.
- Space: `O(unique links)`.

---

# Part IV — DOM Cleaning and Content Extraction

## 14. DOM Sanitization for Analysis

### 14.1 Remove Entirely

```text
script
style
noscript
template
iframe
object
embed
canvas
svg when decorative
form
input
button
select
textarea
```

Elements are also removed when:

- `hidden` attribute exists.
- `aria-hidden="true"`.
- computed or inline style clearly hides the node.
- class or ID matches strong banner, cookie, ad, modal, or navigation patterns.

### 14.2 Pseudocode

```text
FUNCTION cleanDocument(document, cleanupPolicy)
    clone = document.cloneNode(true)
    warnings = EMPTY LIST

    FOR EACH selector IN cleanupPolicy.removeSelectors
        FOR EACH node IN clone.querySelectorAll(selector)
            node.remove()
        END FOR
    END FOR

    FOR EACH element IN clone.querySelectorAll("*")
        IF isHiddenElement(element)
            element.remove()
            CONTINUE
        END IF

        removeDangerousAttributes(element)
    END FOR

    RETURN SUCCESS({ document: clone, warnings })
END FUNCTION
```

This cleaning copy is for extraction only. It must never execute page scripts.

---

## 15. Main-Content Candidate Scoring

### 15.1 Candidate Elements

Evaluate:

```text
main
article
[role="main"]
body direct semantic containers
large section/div containers with meaningful text
```

### 15.2 Features

For each candidate:

- visible normalized text length.
- paragraph text length.
- heading count.
- list item count.
- code character count.
- table cell count.
- link text length.
- interactive element count.
- navigation vocabulary count.
- repeated boilerplate evidence.
- DOM depth.

### 15.3 Suggested Score

```text
score =
    1.0 × paragraphCharacters
  + 25  × headingCount
  + 8   × listItemCount
  + 0.8 × codeCharacters
  + 5   × tableCellCount
  - 1.5 × linkTextCharacters
  - 40  × interactiveElementCount
  - 30  × navigationVocabularyCount
  - boilerplatePenalty
```

Normalize or cap individual terms to avoid a single huge block dominating all evidence.

### 15.4 Pseudocode

```text
FUNCTION selectMainContentRoot(document, policy, boilerplateModel)
    candidates = collectContentCandidates(document)

    IF candidates is empty
        RETURN FAILURE("NO_CONTENT_CANDIDATE", "No content container found", true)
    END IF

    scored = EMPTY LIST

    FOR EACH candidate IN candidates
        features = extractCandidateFeatures(candidate, boilerplateModel)
        score = calculateContentCandidateScore(features, policy.weights)

        APPEND {
            node: candidate,
            score,
            features,
            domOrder: getDocumentOrder(candidate)
        } TO scored
    END FOR

    SORT scored BY score descending,
                   semanticElementPreference descending,
                   domOrder ascending

    best = scored[0]

    IF best.features.normalizedTextLength < policy.minimumTextLength
        RETURN FAILURE("LOW_CONTENT_CANDIDATE", "Best candidate contains too little text", true, {
            score: best.score,
            features: best.features
        })
    END IF

    RETURN SUCCESS({
        root: best.node,
        score: best.score,
        evidence: best.features,
        alternateCandidates: FIRST policy.alternateCount items after best
    })
END FUNCTION
```

### 15.5 Complexity

A carefully implemented feature pass should be `O(e + n)`. Avoid calling full `textContent` repeatedly for many nested candidates; cache subtree statistics in one bottom-up traversal.

---

## 16. Semantic Block Extraction

### 16.1 Supported Block Types

```text
heading
paragraph
ordered-list
unordered-list
list-item
code-block
blockquote
table
callout
horizontal-rule
```

### 16.2 Pseudocode

```text
FUNCTION extractSemanticBlocks(root, pageUrl)
    blocks = EMPTY LIST
    headingStack = EMPTY LIST

    WALK root descendants in document order
        IF node is heading H1..H6
            text = normalizeTextPreservingInlineCode(node)
            IF text is not empty
                level = headingLevel(node)
                updateHeadingStack(headingStack, level, text)
                APPEND HEADING_BLOCK(level, text, copy(headingStack)) TO blocks
            END IF

        ELSE IF node is paragraph and not inside already handled block
            inline = extractInlineContent(node, pageUrl)
            IF inline has meaningful text
                APPEND PARAGRAPH_BLOCK(inline, copy(headingStack)) TO blocks
            END IF

        ELSE IF node is pre or standalone code block
            code = extractCodeExactly(node)
            language = detectCodeLanguage(node)
            APPEND CODE_BLOCK(code, language, copy(headingStack)) TO blocks

        ELSE IF node is ordered or unordered list not nested in handled list
            listBlock = extractListTree(node, pageUrl)
            APPEND listBlock TO blocks

        ELSE IF node is table not nested in handled table
            tableBlock = extractTable(node, pageUrl)
            APPEND tableBlock TO blocks

        ELSE IF node is blockquote
            quote = normalizeWhitespace(node.textContent)
            IF quote is not empty
                APPEND BLOCKQUOTE_BLOCK(quote, copy(headingStack)) TO blocks
            END IF
        END IF
    END WALK

    blocks = removeAdjacentDuplicateBlocks(blocks)
    blocks = removeEmptyBlocks(blocks)

    RETURN SUCCESS(blocks)
END FUNCTION
```

A handled-node registry must prevent paragraphs inside list items or table cells from being emitted twice.

---

## 17. Heading Hierarchy Repair

Documentation pages may jump from `h2` to `h5`. Preserve the original level but create a normalized export level.

```text
FUNCTION normalizeHeadingLevels(blocks)
    currentLevel = 0
    pageMinimum = minimum heading level found, default 1

    FOR EACH heading block IN order
        proposed = heading.originalLevel - pageMinimum + 1
        proposed = CLAMP(proposed, 1, 6)

        IF proposed > currentLevel + 1
            heading.normalizedLevel = currentLevel + 1
            ADD warning "HEADING_LEVEL_JUMP_REPAIRED"
        ELSE
            heading.normalizedLevel = proposed
        END IF

        currentLevel = heading.normalizedLevel
    END FOR

    RETURN blocks
END FUNCTION
```

---

## 18. Table Extraction

### 18.1 Output Model

```js
{
  type: "table",
  caption: "",
  headers: [],
  rows: [],
  warnings: []
}
```

### 18.2 Pseudocode

```text
FUNCTION extractTable(tableElement)
    grid = buildLogicalTableGrid(tableElement)

    IF grid has unsupported overlapping spans
        RETURN tableAsReadableText(tableElement, "COMPLEX_TABLE_FALLBACK")
    END IF

    headers = inferHeaderRow(grid)
    rows = remaining rows

    normalize every cell using inline-content extraction
    pad short rows to equal width

    RETURN {
        type: "table",
        caption: normalized caption text,
        headers,
        rows,
        warnings
    }
END FUNCTION
```

`rowspan` and `colspan` should be expanded into a logical grid within configured maximum dimensions. Oversized tables should use a readable text fallback instead of freezing the UI.

---

## 19. Code Fence Selection

Markdown code may itself contain backticks.

```text
FUNCTION chooseCodeFence(code)
    longestRun = length of longest consecutive backtick run in code
    fenceLength = MAX(3, longestRun + 1)
    RETURN backtick repeated fenceLength times
END FUNCTION
```

This guarantees that the generated fence does not terminate inside the code block.

---

# Part V — Duplicate and Boilerplate Intelligence

## 20. Text Normalization for Comparison

```text
FUNCTION normalizeForComparison(text)
    text = Unicode normalize using NFKC
    text = LOWERCASE(text)
    text = replace non-breaking spaces with normal spaces
    text = collapse whitespace
    text = remove repeated punctuation used only as decoration
    RETURN TRIM(text)
END FUNCTION
```

Do not remove programming symbols from code blocks when computing structure-aware hashes. Plain-text duplicate detection and code-preservation checks are separate signals.

---

## 21. Exact Content Hash

Use browser-native Web Crypto SHA-256 over the normalized comparison text.

```text
ASYNC FUNCTION computeContentHash(text)
    normalized = normalizeForComparison(text)
    bytes = UTF8_ENCODE(normalized)
    digest = AWAIT crypto.subtle.digest("SHA-256", bytes)
    RETURN HEX_ENCODE(digest)
END FUNCTION
```

Web Crypto is a browser-native capability and does not add an external package or network dependency.

Complexity:

- Time: `O(n)`.
- Space: `O(n)` for encoded bytes.

---

## 22. Near-Duplicate Detection with Word Shingles

### 22.1 Method

1. Normalize text.
2. Tokenize into meaningful words.
3. Create fixed-width word shingles, recommended width `5`.
4. Hash each shingle.
5. Compute Jaccard similarity.

### 22.2 Pseudocode

```text
FUNCTION buildShingleSet(tokens, width, maximumShingles)
    shingles = EMPTY SET

    IF tokens.length < width
        ADD JOIN(tokens, " ") TO shingles
        RETURN shingles
    END IF

    step = MAX(1, FLOOR((tokens.length - width + 1) / maximumShingles))

    FOR i FROM 0 TO tokens.length - width STEP step
        shingle = JOIN(tokens[i : i + width], " ")
        ADD stableStringHash(shingle) TO shingles

        IF shingles.size >= maximumShingles
            BREAK
        END IF
    END FOR

    RETURN shingles
END FUNCTION
```

```text
FUNCTION jaccardSimilarity(setA, setB)
    IF both sets are empty
        RETURN 1
    END IF

    smaller = smaller of setA and setB
    larger = the other set
    intersectionCount = 0

    FOR EACH item IN smaller
        IF item IN larger
            intersectionCount = intersectionCount + 1
        END IF
    END FOR

    unionCount = setA.size + setB.size - intersectionCount
    RETURN intersectionCount / unionCount
END FUNCTION
```

### 22.3 Suggested Classification

```text
1.00                 exact normalized duplicate
0.90 to <1.00        very strong near duplicate
0.75 to <0.90        probable near duplicate
below 0.75           not duplicate by this signal
```

Thresholds must be validated against test fixtures before release.

---

## 23. Cross-Page Boilerplate Detection

### 23.1 Block Fingerprints

Split pages into short semantic blocks such as headings, paragraphs, list groups, and callouts. Normalize and hash blocks whose text is within configured length limits.

### 23.2 Incremental Frequency Model

```text
FUNCTION updateBoilerplateModel(pageBlocks, model)
    pageSeen = EMPTY SET

    FOR EACH block IN pageBlocks
        normalized = normalizeForComparison(block.text)

        IF normalized.length < model.minimumBlockLength
            CONTINUE
        END IF

        fingerprint = stableStringHash(normalized)

        IF fingerprint IN pageSeen
            CONTINUE
        END IF

        ADD fingerprint TO pageSeen
        model.documentFrequency[fingerprint] += 1
        model.sampleText[fingerprint] = first bounded sample
    END FOR

    model.processedPageCount += 1
    RETURN model
END FUNCTION
```

### 23.3 Classification

```text
FUNCTION classifyBoilerplate(blockFingerprint, model, policy)
    frequency = model.documentFrequency[blockFingerprint] OR 0
    ratio = frequency / MAX(1, model.processedPageCount)

    IF frequency >= policy.minimumPages AND ratio >= policy.strongRatio
        RETURN { level: "STRONG", ratio }
    END IF

    IF frequency >= policy.minimumPages AND ratio >= policy.possibleRatio
        RETURN { level: "POSSIBLE", ratio }
    END IF

    RETURN { level: "NONE", ratio }
END FUNCTION
```

Repeated content must initially be down-ranked or flagged, not automatically deleted. Important legal notices, version warnings, and shared prerequisites can legitimately repeat.

---

# Part VI — Quality Scoring and Recovery

## 24. Page Quality Score

### 24.1 Dimensions

Each dimension is normalized to `0..1`:

```text
titlePresence
meaningfulText
headingStructure
contentDensity
codePreservation
tablePreservation
linkIntegrity
boilerplateCleanliness
duplicateUniqueness
structuralValidity
```

### 24.2 Weighted Score

```text
qualityScore = ROUND(100 × weightedAverage(dimensions))
```

Suggested initial weights:

```text
titlePresence           0.05
meaningfulText          0.20
headingStructure        0.10
contentDensity          0.15
codePreservation        0.10
tablePreservation       0.08
linkIntegrity           0.07
boilerplateCleanliness  0.10
duplicateUniqueness     0.05
structuralValidity      0.10
```

Weights must total `1.0`.

### 24.3 Pseudocode

```text
FUNCTION evaluatePageQuality(page, evidence, policy)
    dimensions = {
        titlePresence: page.title is meaningful ? 1 : 0,
        meaningfulText: boundedLengthScore(page.plainText.length, policy.textLength),
        headingStructure: scoreHeadingStructure(page.headings),
        contentDensity: scoreContentDensity(evidence),
        codePreservation: scorePreservation(evidence.sourceCodeBlocks, page.codeBlocks),
        tablePreservation: scorePreservation(evidence.sourceTables, page.tables),
        linkIntegrity: scoreLinkIntegrity(page.links),
        boilerplateCleanliness: 1 - evidence.boilerplateRatio,
        duplicateUniqueness: 1 - evidence.duplicateSimilarity,
        structuralValidity: scoreStructuralValidity(page)
    }

    score = 0
    FOR EACH dimensionName IN dimensions
        score += dimensions[dimensionName] * policy.weights[dimensionName]
    END FOR

    warnings = deriveQualityWarnings(dimensions, evidence, policy)

    RETURN {
        score: ROUND(score * 100),
        dimensions,
        warnings,
        policyVersion: policy.version
    }
END FUNCTION
```

### 24.4 Quality Bands

```text
85..100  strong
70..84   acceptable
50..69   weak; accept only with warnings or alternate extraction comparison
0..49    failed extraction candidate
```

These bands are policy defaults, not universal truths. Test fixtures must calibrate them.

---

## 25. Recovery Decision Algorithm

### 25.1 Decision Priority

1. User cancellation.
2. Unsafe or out-of-scope redirect.
3. Permanent HTTP or content failure.
4. Recoverable network failure with retries remaining.
5. Low extraction quality with unused alternate root.
6. Weak but usable extraction.
7. Retry exhaustion.

### 25.2 Pseudocode

```text
FUNCTION decideRecovery(task, result, context)
    IF context.cancelRequested
        RETURN DECISION("CANCEL_TASK", "USER_CANCELLED")
    END IF

    IF result.error.code IN context.permanentSafetyErrors
        RETURN DECISION("SKIP_PAGE", result.error.code)
    END IF

    IF result.error.recoverable AND task.attempts < context.retryLimit
        delay = calculateRetryDelay(task.attempts, result.error, context.retryPolicy)
        RETURN DECISION("RETRY_FETCH", "RECOVERABLE_FAILURE", {
            nextAttempt: task.attempts + 1,
            delayMs: delay
        })
    END IF

    IF result.stage == "EXTRACTION" AND context.hasUnusedAlternateRoot
        RETURN DECISION("RETRY_EXTRACTION", "ALTERNATE_CONTENT_ROOT_AVAILABLE")
    END IF

    IF result.qualityScore >= context.minimumAcceptWithWarning
        RETURN DECISION("ACCEPT_WITH_WARNING", "WEAK_BUT_USABLE_EXTRACTION")
    END IF

    IF task.attempts >= context.retryLimit
        RETURN DECISION("FAIL_PAGE", "RETRY_LIMIT_EXHAUSTED")
    END IF

    RETURN DECISION("FAIL_PAGE", result.error.code OR "UNRECOVERABLE_FAILURE")
END FUNCTION
```

### 25.3 Exponential Backoff

```text
FUNCTION calculateRetryDelay(attempt, error, policy)
    base = policy.baseDelayMs
    exponent = MIN(attempt, policy.maximumExponent)
    delay = base * (2 ^ exponent)

    IF error.retryAfterMs exists
        delay = MAX(delay, error.retryAfterMs)
    END IF

    RETURN MIN(delay, policy.maximumDelayMs)
END FUNCTION
```

The default implementation should avoid random jitter to preserve deterministic tests. Runtime-specific deterministic jitter may be derived from a stable task hash when needed to spread requests.

---

# Part VII — Archive Construction and Export

## 26. Stable Page Ordering

### 26.1 Order Keys

1. Start page first.
2. Known navigation sequence.
3. Lower crawl depth.
4. Earlier discovery sequence.
5. Canonical URL ascending.
6. Page ID ascending.

### 26.2 Pseudocode

```text
FUNCTION comparePagesForArchive(a, b)
    IF a.isStartPage != b.isStartPage
        RETURN a.isStartPage comes first
    END IF

    IF a.navigationSequence exists OR b.navigationSequence exists
        compare missing values after present values
        compare numeric sequence ascending
    END IF

    IF a.depth != b.depth
        RETURN a.depth - b.depth
    END IF

    IF a.discoverySequence != b.discoverySequence
        RETURN a.discoverySequence - b.discoverySequence
    END IF

    IF a.canonicalUrl != b.canonicalUrl
        RETURN lexicalCompare(a.canonicalUrl, b.canonicalUrl)
    END IF

    RETURN lexicalCompare(a.pageId, b.pageId)
END FUNCTION
```

---

## 27. Markdown Generation

### 27.1 Rules

- Generate from normalized semantic blocks, never raw page HTML.
- Escape Markdown control characters in normal text.
- Preserve code exactly.
- Normalize page heading levels under the archive hierarchy.
- Include source URL for every page.
- Use deterministic blank-line rules.

### 27.2 Pseudocode

```text
FUNCTION pageToMarkdown(page, exportPolicy)
    output = EMPTY LIST

    APPEND heading(exportPolicy.pageHeadingLevel, page.title) TO output
    APPEND "Source: " + page.canonicalUrl TO output
    APPEND "" TO output

    FOR EACH block IN page.blocks
        rendered = renderMarkdownBlock(block, exportPolicy)

        IF rendered is not empty
            APPEND rendered TO output
            APPEND "" TO output
        END IF
    END FOR

    RETURN trimExcessBlankLines(JOIN(output, "\n"))
END FUNCTION
```

### 27.3 Archive Generation

```text
FUNCTION buildMarkdownArchive(snapshot, exportPolicy)
    pages = COPY(snapshot.pages)
    STABLE_SORT pages using comparePagesForArchive

    toc = buildTableOfContents(pages, exportPolicy)
    output = [archive title, metadata, toc]

    FOR EACH page IN pages
        APPEND pageToMarkdown(page, exportPolicy) TO output
    END FOR

    markdown = JOIN(output, "\n\n")
    validation = validateMarkdownArchive(markdown, snapshot)

    IF validation.ok == false
        RETURN validation
    END IF

    RETURN SUCCESS(markdown)
END FUNCTION
```

### 27.4 Complexity

- Time: `O(total archive content + p log p)`.
- Space: `O(total generated output)` unless streamed in chunks.

---

## 28. JSON Export Stability

Before serialization:

1. Sort pages using archive order.
2. Sort object keys using a fixed schema order.
3. Sort warnings and reason codes deterministically.
4. Exclude volatile runtime-only fields unless the export schema requires them.
5. Store `schemaVersion` and `extractionVersion`.

```text
FUNCTION stableSerialize(value, schemaOrder)
    recursively order object keys by schema order,
    then unknown keys lexicographically
    preserve array order where semantically meaningful
    RETURN JSON.stringify(orderedValue, null, 2)
END FUNCTION
```

---

# Part VIII — Local Search

## 29. Tokenization and Normalization

### 29.1 Goals

- Work without language-model APIs.
- Preserve technical identifiers.
- Support words such as `IndexedDB`, `C++`, `node.js`, `foo_bar`, `HTTP/2`, and file paths.

### 29.2 Pseudocode

```text
FUNCTION tokenize(text, policy)
    normalized = Unicode normalize using NFKC
    normalized = LOWERCASE(normalized)
    normalized = normalize apostrophes and dashes

    rawTokens = scan characters while preserving configured technical symbols
    tokens = EMPTY LIST

    FOR EACH token IN rawTokens
        token = trim surrounding punctuation

        IF token is empty
            CONTINUE
        END IF

        IF token.length > policy.maximumTokenLength
            token = token.substring(0, policy.maximumTokenLength)
        END IF

        IF token IN policy.stopWords AND NOT looksTechnical(token)
            CONTINUE
        END IF

        APPEND token TO tokens
    END FOR

    RETURN tokens
END FUNCTION
```

No stemming should be included in the first release unless implemented and tested per language. Incorrect stemming can damage technical search.

---

## 30. Section Splitting

```text
FUNCTION splitPageIntoSections(page)
    sections = EMPTY LIST
    current = new section using page title

    FOR EACH block IN page.blocks
        IF block.type == "heading"
            IF current contains meaningful content
                APPEND finalize(current) TO sections
            END IF

            current = new section using block.headingPath
        ELSE
            APPEND block TO current.blocks
        END IF
    END FOR

    IF current contains meaningful content
        APPEND finalize(current) TO sections
    END IF

    assign deterministic section IDs by page ID and order
    RETURN sections
END FUNCTION
```

Very large sections should be divided into bounded passages while retaining the original heading path.

---

## 31. Inverted Index Construction

### 31.1 Posting Model

```js
{
  term,
  documentFrequency,
  postings: [
    {
      sectionId,
      pageId,
      bodyFrequency,
      headingFrequency,
      positions: []
    }
  ]
}
```

Positions may be capped or omitted for extremely frequent terms.

### 31.2 Pseudocode

```text
FUNCTION indexSection(section, index, tokenizerPolicy)
    headingTokens = tokenize(JOIN(section.headingPath, " "), tokenizerPolicy)
    bodyTokens = tokenize(section.text, tokenizerPolicy)

    localPostings = EMPTY MAP

    FOR EACH token WITH position IN headingTokens
        posting = getOrCreate(localPostings, token)
        posting.headingFrequency += 1
        APPEND encoded heading position TO posting.positions
    END FOR

    FOR EACH token WITH position IN bodyTokens
        posting = getOrCreate(localPostings, token)
        posting.bodyFrequency += 1
        IF posting.positions.length < positionLimit
            APPEND position TO posting.positions
        END IF
    END FOR

    FOR EACH (term, posting) IN localPostings
        index.addPosting(term, section.sectionId, posting)
    END FOR

    RETURN SUCCESS({ indexedTerms: localPostings.size })
END FUNCTION
```

### 31.3 Incremental Updates

Index writes should occur after the page record and section records are committed. Re-indexing a page must first remove postings associated with its previous extraction version.

---

## 32. Search Ranking

### 32.1 Score Components

For query term `t` and section `d`:

```text
idf(t) = log((N + 1) / (df(t) + 1)) + 1
termScore = idf(t) × (
    headingWeight × headingFrequency
  + bodyWeight × normalizedBodyFrequency
)
```

Additional signals:

- exact phrase bonus.
- all-query-terms bonus.
- title match bonus.
- heading-path match bonus.
- proximity bonus.
- repeated-term saturation.

### 32.2 Pseudocode

```text
FUNCTION searchIndex(query, index, policy)
    queryTokens = tokenize(query, policy.tokenizer)

    IF queryTokens is empty
        RETURN FAILURE("EMPTY_QUERY", "Query contains no searchable terms")
    END IF

    candidateScores = EMPTY MAP
    matchedTerms = EMPTY MAP

    FOR EACH unique term IN queryTokens
        termRecord = index.getTerm(term)
        IF termRecord does not exist
            CONTINUE
        END IF

        idf = LOG((index.sectionCount + 1) / (termRecord.documentFrequency + 1)) + 1

        FOR EACH posting IN termRecord.postings
            bodyComponent = saturatingFrequency(posting.bodyFrequency, policy.bodySaturation)
            headingComponent = posting.headingFrequency * policy.headingWeight
            contribution = idf * (bodyComponent + headingComponent)

            candidateScores[posting.sectionId] += contribution
            ADD term TO matchedTerms[posting.sectionId]
        END FOR
    END FOR

    results = EMPTY LIST

    FOR EACH sectionId IN candidateScores
        section = index.getSectionMetadata(sectionId)
        score = candidateScores[sectionId]

        score += phraseBonus(queryTokens, section, policy)
        score += coverageBonus(matchedTerms[sectionId], queryTokens, policy)
        score += titleAndHeadingBonus(queryTokens, section, policy)
        score += proximityBonus(queryTokens, section, policy)

        APPEND { sectionId, score, evidence } TO results
    END FOR

    SORT results BY score descending,
                    page archive order ascending,
                    section order ascending,
                    section ID ascending

    RETURN SUCCESS(FIRST policy.maximumResults results)
END FUNCTION
```

### 32.3 Complexity

Primarily proportional to postings visited for query terms, plus `O(r log r)` for ranking `r` candidates.

---

## 33. Search Snippet Selection

```text
FUNCTION selectSnippet(sectionText, queryTokens, maximumCharacters)
    sentences = splitIntoSentencesOrBoundedChunks(sectionText)
    best = null

    FOR EACH sentenceWindow of one to three adjacent sentences
        score = count unique query-token matches
              + phrase match bonus
              + proximity bonus
              - excessive length penalty

        choose highest score,
        then earliest window as tie-breaker
    END FOR

    RETURN trimToBoundary(best.text, maximumCharacters)
END FUNCTION
```

---

# Part IX — Extractive Question Answering

## 34. Question Processing

### 34.1 Pipeline

1. Validate question length.
2. Tokenize using the search tokenizer.
3. Detect quoted phrases.
4. Down-weight generic question terms such as `what`, `why`, `how`, `which`.
5. Retrieve candidate sections.
6. Rank supporting passages.
7. Return extracts with sources.
8. Report insufficient evidence when thresholds are not met.

### 34.2 Candidate Retrieval

Use the local search algorithm with a larger internal candidate count, such as top `20` sections, before final passage selection.

---

## 35. Passage Window Construction

```text
FUNCTION buildPassages(section, policy)
    units = split section text into sentences or bounded lines
    passages = EMPTY LIST

    FOR start FROM 0 TO units.length - 1
        text = ""

        FOR end FROM start TO MIN(units.length - 1, start + policy.maximumUnits - 1)
            candidate = append units[end] to text

            IF candidate.length > policy.maximumPassageCharacters
                BREAK
            END IF

            IF candidate.length >= policy.minimumPassageCharacters
                APPEND {
                    text: candidate,
                    startUnit: start,
                    endUnit: end
                } TO passages
            END IF

            text = candidate
        END FOR
    END FOR

    RETURN passages
END FUNCTION
```

The number of generated windows must be capped for very large sections.

---

## 36. Passage Ranking

### 36.1 Components

```text
query-term coverage
rare-term evidence
exact phrase match
term proximity
heading relevance
passage conciseness
source section search score
```

### 36.2 Pseudocode

```text
FUNCTION rankAnswerPassages(question, candidateSections, policy)
    queryTokens = tokenize(question, policy.tokenizer)
    ranked = EMPTY LIST

    FOR EACH sectionResult IN candidateSections
        passages = buildPassages(sectionResult.section, policy.passage)

        FOR EACH passage IN passages
            passageTokens = tokenize(passage.text, policy.tokenizer)
            evidence = computePassageEvidence(queryTokens, passageTokens, passage.text)

            score =
                evidence.coverage * policy.coverageWeight
              + evidence.rareTermScore * policy.rareTermWeight
              + evidence.phraseScore * policy.phraseWeight
              + evidence.proximityScore * policy.proximityWeight
              + sectionResult.headingScore * policy.headingWeight
              + sectionResult.searchScore * policy.sectionWeight
              - evidence.lengthPenalty

            APPEND {
                passage,
                sectionId: sectionResult.sectionId,
                pageId: sectionResult.pageId,
                sourceUrl: sectionResult.sourceUrl,
                score,
                evidence
            } TO ranked
        END FOR
    END FOR

    SORT ranked BY score descending,
                   source archive order ascending,
                   passage start ascending

    RETURN deduplicateOverlappingPassages(ranked, policy.maximumAnswers)
END FUNCTION
```

---

## 37. Confidence and Insufficient Evidence

### 37.1 Confidence Signals

- fraction of important query terms matched.
- exact phrase presence.
- margin between best and second-best passage.
- number of independent supporting pages.
- absolute passage score.
- whether the best match is mainly a heading without body evidence.

### 37.2 Pseudocode

```text
FUNCTION classifyAnswerConfidence(questionEvidence, rankedPassages, policy)
    IF rankedPassages is empty
        RETURN { level: "INSUFFICIENT", reason: "NO_MATCHING_PASSAGE" }
    END IF

    best = rankedPassages[0]
    second = rankedPassages[1] OR null
    margin = second is null ? best.score : best.score - second.score

    IF best.evidence.coverage < policy.minimumCoverage
        RETURN { level: "INSUFFICIENT", reason: "LOW_QUERY_COVERAGE" }
    END IF

    IF best.score < policy.minimumAnswerScore
        RETURN { level: "INSUFFICIENT", reason: "LOW_EVIDENCE_SCORE" }
    END IF

    IF best.evidence.coverage >= policy.highCoverage AND
       best.score >= policy.highScore AND
       margin >= policy.highMargin
        RETURN { level: "HIGH", reason: "STRONG_PASSAGE_MATCH" }
    END IF

    RETURN { level: "MEDIUM", reason: "USABLE_EXTRACTIVE_EVIDENCE" }
END FUNCTION
```

### 37.3 Output Contract

```js
{
  answerType: "EXTRACTIVE" | "INSUFFICIENT_EVIDENCE",
  passages: [
    {
      text,
      pageTitle,
      headingPath,
      sourceUrl,
      score
    }
  ],
  confidence: {
    level,
    reason
  }
}
```

The engine must not compose unsupported facts. It may return multiple extracted passages when one passage is incomplete.

---

# Part X — Final Validation

## 38. Archive Validation Algorithm

### 38.1 Checks

- Archive contains at least one accepted page.
- Every exported page has a canonical source URL.
- Page and section IDs are unique.
- Archive ordering is stable.
- Markdown heading structure is valid.
- Every code fence closes.
- JSON matches the expected schema version.
- Failed and skipped pages have reason codes.
- Index postings reference existing sections.
- QA source references point to existing pages.
- No raw script or unsafe HTML is present in rendered output.

### 38.2 Pseudocode

```text
FUNCTION validateArchive(snapshot, exports, index, policy)
    errors = EMPTY LIST
    warnings = EMPTY LIST

    IF snapshot.acceptedPages.length == 0
        ADD error "EMPTY_ARCHIVE"
    END IF

    validateUniqueIds(snapshot, errors)
    validateSourceUrls(snapshot, errors)
    validatePageOrder(snapshot, errors)
    validateMarkdown(exports.markdown, errors, warnings)
    validateJsonSchema(exports.json, policy.schemaVersion, errors)
    validateFailureReasons(snapshot.failures, errors)
    validateIndexReferences(index, snapshot.sections, errors)
    validateQaReferences(snapshot.qaRecords, snapshot.pages, errors)
    validateUnsafeOutput(exports, errors)

    IF errors is not empty
        RETURN FAILURE("ARCHIVE_VALIDATION_FAILED", "Archive failed validation", false, {
            errors,
            warnings
        })
    END IF

    RETURN SUCCESS({
        valid: true,
        warnings,
        validatedAt: CURRENT_TIME(),
        validatorVersion: policy.version
    })
END FUNCTION
```

---

# Part XI — Performance and Resource Limits

## 39. Required Default Limits

Exact defaults may change after testing, but every value must exist:

```text
maximum pages
maximum crawl depth
maximum queued tasks
maximum retries
fetch timeout
maximum HTML bytes per page
maximum extracted characters per page
maximum table dimensions
maximum shingles per page
maximum index positions per term per section
maximum search results
maximum candidate QA sections
maximum passage windows per section
maximum exported archive size warning threshold
```

A limit violation must produce an explicit reason code, not silent truncation. When safe truncation is used, the page or export must contain a warning.

## 40. Incremental Processing Rules

- Persist each accepted page before fetching the next page.
- Batch index writes by bounded section count.
- Do not rebuild the whole index after each page.
- Do not retain full HTML after extraction unless a debug mode explicitly requests it.
- Store normalized hashes and statistics so duplicate checks do not reprocess old page text unnecessarily.
- Yield to the event loop during large loops.
- Use workers for expensive pure computations when measurements show UI blocking.

---

# Part XII — Algorithm Test Matrix

## 41. URL and Safety Tests

- Equivalent URL forms produce the same canonical URL.
- Out-of-origin and out-of-path URLs are rejected.
- Unsafe account links are rejected.
- Allowed documentation query parameters are preserved.
- Tracking parameters are removed only by policy.

## 42. Queue and State Tests

- Stable ordering under equal scores.
- Duplicate enqueue rejection.
- Queue-cap enforcement.
- Every valid and invalid state transition.
- Restart recovery from persisted state.

## 43. Fetch Tests

- HTML success.
- Non-HTML rejection.
- Redirect inside and outside scope.
- Timeout.
- 404, 429, and 500 classification.
- HTML-size limit.

## 44. Extraction Tests

- Article pages.
- Sidebar-heavy documentation.
- Nested lists.
- Complex code fences.
- Tables with spans.
- Hidden content.
- Repeated navigation.
- Missing main element.
- Broken heading hierarchy.

## 45. Intelligence Tests

- Exact duplicates.
- Near duplicates.
- Legitimately repeated prerequisites.
- Boilerplate-heavy pages.
- Strong, weak, and failed quality bands.
- Bounded retry decisions.

## 46. Search and QA Tests

- Exact technical term.
- Multi-word query.
- Heading-only match.
- Phrase preference.
- Rare-term ranking.
- Missing information.
- Ambiguous question.
- Multiple supporting pages.
- Source attribution.
- Stable result order.

## 47. Export and Validation Tests

- Stable Markdown output.
- Backticks inside code blocks.
- Duplicate titles.
- Empty archives.
- Broken references.
- Invalid JSON schema.
- Export after partial crawl.

---

# Part XIII — Completion Criteria

This algorithms document is considered implemented only when:

1. Each public algorithm has a corresponding source module.
2. Every decision returns structured evidence and a reason code.
3. Unit tests cover normal, boundary, and failure cases.
4. Complexity remains within the targets described here.
5. Runtime limits prevent unbounded work.
6. Search and QA remain fully local and source-backed.
7. Repeated runs over the same stored snapshot produce identical archive ordering and ranking.
8. No algorithm requires an npm package, cloud API, backend, or hosted model.
9. Documentation and implementation versions stay synchronized.
10. Real documentation fixtures demonstrate correct end-to-end behavior.

## 48. Recommended Implementation Order

```text
URL normalization
-> scope guard
-> state machine
-> stable priority queue
-> controlled fetch
-> link discovery
-> DOM cleaning
-> main-content scoring
-> semantic block extraction
-> quality scoring
-> Markdown and JSON export
-> duplicate and boilerplate detection
-> recovery manager
-> tokenizer and section splitter
-> inverted index
-> search ranking
-> extractive question answering
-> archive validation
```

The basic crawler and exporter must be reliable before offline intelligence is allowed to control recovery or acceptance decisions.
