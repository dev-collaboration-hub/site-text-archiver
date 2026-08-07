import {
  assertEqual,
  assertFalse,
  assertResultOk,
  assertTrue
} from "../assertions.js";
import { describe, test } from "../test-runner.js";
import { success } from "../../src/shared/result.js";
import { parseHtml } from "../../src/extraction/html-parser.js";
import { cleanDocument } from "../../src/extraction/dom-cleaner.js";
import { detectMainContent } from "../../src/extraction/main-content-detector.js";
import { extractSemanticContent } from "../../src/extraction/content-extractor.js";
import { extractPageFromHtml } from "../../src/extraction/extraction-pipeline.js";
import { findElements, textContent } from "../../src/extraction/dom-utils.js";
import { processNextExtractionTask } from "../../src/crawler/extraction-runner.js";
import { createCrawlConfig } from "../../src/crawler/crawl-config.js";
import { createCrawlRun } from "../../src/crawler/crawl-run.js";
import { CRAWL_EVENTS } from "../../src/crawler/crawl-state.js";
import { createPriorityTaskQueue } from "../../src/crawler/priority-task-queue.js";
import { applyRunTransition } from "../../src/crawler/state-transition.js";
import { createTaskRecord, TASK_STATES } from "../../src/crawler/task-record.js";

const FIXTURE = `<!doctype html>
<html lang="en">
<head>
  <title>Install Guide</title>
  <meta name="description" content="Install the tool">
  <meta name="author" content="Docs Team">
  <link rel="canonical" href="/docs/install">
  <style>.hidden{display:none}</style>
</head>
<body>
  <nav><a href="/home">Home</a><a href="/docs/a">A</a><a href="/docs/b">B</a></nav>
  <main id="documentation">
    <h1>Install Guide</h1>
    <p>Use <code>npm-free</code> mode and read the <a href="/docs/api">API docs</a>.</p>
    <h3>Steps</h3>
    <ol><li>Download<ul><li>Verify files</li></ul></li><li>Load extension</li></ol>
    <pre class="language-js"><code>const x = 1;\n  console.log(x);</code></pre>
    <table><caption>Options</caption><tr><th>Name</th><th>Meaning</th></tr><tr><td rowspan="2">mode</td><td>fast</td></tr><tr><td>safe</td></tr></table>
    <blockquote>Keep the source URL.</blockquote>
    <div class="callout warning">Check permissions first.</div>
    <p hidden>Secret hidden text</p>
    <script>throw new Error('must never run');</script>
  </main>
  <footer>Footer links and legal text</footer>
</body>
</html>`;

describe("M4 scratch parser and cleaner", () => {
  test("closes raw text elements and removes executable or hidden content", () => {
    const parsed = parseHtml(FIXTURE);
    assertResultOk(parsed);
    const cleaned = cleanDocument(parsed.value.document);
    assertResultOk(cleaned);
    assertEqual(findElements(cleaned.value.document, node => node.tagName === "script").length, 0);
    assertEqual(findElements(cleaned.value.document, node => node.tagName === "style").length, 0);
    assertFalse(textContent(cleaned.value.document).includes("Secret hidden text"));
    assertTrue(cleaned.value.removalStats.removedNodes >= 3);
  });
});

describe("M4 main content detection", () => {
  test("prefers explicit main content over body and navigation", () => {
    const parsed = parseHtml(FIXTURE).value.document;
    const cleaned = cleanDocument(parsed).value.document;
    const selected = detectMainContent(cleaned);
    assertResultOk(selected);
    assertEqual(selected.value.selectedRoots[0].node.tagName, "main");
    assertTrue(selected.value.confidence > 0.5);
  });
});

describe("M4 semantic extraction", () => {
  test("preserves headings, inline code, nested lists, code blocks, tables and callouts", () => {
    const cleaned = cleanDocument(parseHtml(FIXTURE).value.document).value.document;
    const selected = detectMainContent(cleaned).value;
    const extracted = extractSemanticContent(cleaned, selected.selectedRoots, "https://example.test/docs/install");
    assertResultOk(extracted);
    assertEqual(extracted.value.metadata.title, "Install Guide");
    assertEqual(extracted.value.metadata.canonicalLink, "https://example.test/docs/install");
    assertTrue(extracted.value.blocks.some(block => block.type === "code-block" && block.language === "js"));
    assertTrue(extracted.value.blocks.some(block => block.type === "ordered-list" && block.items[0].children.length === 1));
    const table = extracted.value.blocks.find(block => block.type === "table");
    assertTrue(Boolean(table));
    assertEqual(table.headers[0], "Name");
    assertEqual(table.rows[1][0], "mode");
    assertTrue(extracted.value.blocks.some(block => block.type === "callout"));
    assertTrue(extracted.value.warnings.some(warning => warning.code === "HEADING_LEVEL_JUMP"));
  });

  test("builds a deterministic PageRecord with hashes and no raw HTML", async () => {
    const task = {
      taskId: "task_crawl_test_1",
      crawlId: "crawl_test",
      url: "https://example.test/docs/install",
      canonicalKey: "https://example.test/docs/install",
      parentUrl: null,
      depth: 0,
      priorityScore: 100,
      discoveryOrder: 1,
      attempt: 0,
      state: TASK_STATES.FETCHED,
      availableAt: 0,
      createdAt: 0,
      updatedAt: 0
    };
    const result = await extractPageFromHtml({
      html: FIXTURE,
      task,
      url: task.url,
      canonicalUrl: task.url,
      fetchedAt: 10,
      extractedAt: 20
    });
    assertResultOk(result);
    assertTrue(result.value.contentHash.startsWith("sha256:"));
    assertTrue(result.value.structureHash.startsWith("sha256:"));
    assertTrue(result.value.blocks.length >= 7);
    assertEqual(result.value.html, undefined);
  });
});

describe("M4 persisted extraction runner", () => {
  test("moves FETCHED through EXTRACTING to EXTRACTED and records a page summary", async () => {
    const crawlId = "crawl_extract";
    const config = createCrawlConfig({
      startUrl: "https://example.test/docs/",
      allowedOrigin: "https://example.test",
      allowedPathPrefix: "/docs",
      maxPages: 3,
      maxDepth: 2,
      requestDelayMs: 0,
      retryLimit: 1
    }, crawlId, 1).value;
    let run = createCrawlRun(crawlId, 1).value;
    run = applyRunTransition(run, CRAWL_EVENTS.PLAN_READY, 2).value;
    run = applyRunTransition(run, CRAWL_EVENTS.START, 3).value;
    const queue = createPriorityTaskQueue({ maxSize: 3 });
    const task = createTaskRecord({
      taskId: `task_${crawlId}_1`,
      crawlId,
      url: "https://example.test/docs/",
      canonicalKey: "https://example.test/docs",
      depth: 0,
      priorityScore: 100,
      discoveryOrder: 1,
      attempt: 0,
      state: TASK_STATES.QUEUED,
      availableAt: 0
    }, 1).value;
    queue.enqueue(task);
    queue.markState(task.taskId, TASK_STATES.FETCHING, {}, 2);
    queue.markState(task.taskId, TASK_STATES.FETCHED, {}, 3);
    const snapshot = {
      schemaVersion: 1,
      config,
      run,
      queue: queue.snapshot(),
      fetchRecords: [{ taskId: task.taskId, finalUrl: task.url, fetchedAt: 3 }],
      pageSummaries: [],
      events: [],
      requestCache: []
    };
    let deleted = false;
    const result = await processNextExtractionTask(snapshot, {
      now: () => 10,
      persistSnapshot: async value => success(structuredClone(value)),
      getFetchedHtml: async () => success({ html: FIXTURE, url: task.url, fetchedAt: 3 }),
      putPageRecord: async () => success({ stored: true }),
      deleteFetchedHtml: async () => { deleted = true; return success({ deleted: true }); },
      extractPage: async () => success({
        pageId: `page_${task.taskId}`,
        taskId: task.taskId,
        url: task.url,
        title: "Install Guide",
        blocks: [{ type: "heading" }],
        headings: [{ text: "Install Guide" }],
        extractionWarnings: [],
        extractedAt: 10
      })
    });
    assertResultOk(result);
    assertEqual(result.value.action, "EXTRACTED");
    assertEqual(result.value.snapshot.run.counts.extracted, 1);
    assertEqual(result.value.snapshot.pageSummaries.length, 1);
    assertTrue(deleted);
  });
});
