import {
  assertDeepEqual,
  assertEqual,
  assertResultError,
  assertResultOk,
  assertTrue
} from "../assertions.js";
import { describe, test } from "../test-runner.js";
import { success } from "../../src/shared/result.js";
import { CRAWL_EVENTS } from "../../src/crawler/crawl-state.js";
import { createCrawlConfig } from "../../src/crawler/crawl-config.js";
import { createCrawlRun } from "../../src/crawler/crawl-run.js";
import { fetchHtmlPage } from "../../src/crawler/fetcher.js";
import { discoverPageLinks, scanStartTags } from "../../src/crawler/link-discovery.js";
import { processNextNetworkTask } from "../../src/crawler/network-crawler.js";
import { createPriorityTaskQueue } from "../../src/crawler/priority-task-queue.js";
import { classifyHttpResponse, parseRetryAfter } from "../../src/crawler/response-classifier.js";
import { applyRunTransition } from "../../src/crawler/state-transition.js";
import { createTaskRecord, TASK_STATES } from "../../src/crawler/task-record.js";

describe("M3 response classification", () => {
  test("accepts HTML and rejects non-HTML success responses", () => {
    assertEqual(
      classifyHttpResponse({ status: 200, contentType: "text/html; charset=utf-8" }).value.disposition,
      "ACCEPT"
    );
    assertEqual(
      classifyHttpResponse({ status: 200, contentType: "application/pdf" }).value.reasonCode,
      "NON_HTML_RESPONSE"
    );
  });

  test("classifies retryable server and rate-limit responses", () => {
    const limited = classifyHttpResponse({
      status: 429,
      contentType: "text/html",
      retryAfter: "2",
      now: 1000
    });
    assertEqual(limited.value.disposition, "RETRY");
    assertEqual(limited.value.retryAfterMs, 2000);
    assertEqual(classifyHttpResponse({ status: 503 }).value.reasonCode, "HTTP_SERVER_ERROR");
  });

  test("parses HTTP-date Retry-After values", () => {
    assertEqual(
      parseRetryAfter("Thu, 01 Jan 1970 00:00:05 GMT", 1000),
      4000
    );
  });
});

describe("M3 scratch HTML link discovery", () => {
  test("honors base and canonical links and deduplicates anchors", () => {
    const result = discoverPageLinks(
      `<!doctype html><base href="/docs/"><link rel="canonical" href="guide"><a href="a">A</a><a href="a">duplicate</a><a href="../b?x=1&amp;y=2">B</a>`,
      "https://example.test/root/index"
    );
    assertResultOk(result);
    assertEqual(result.value.baseUrl, "https://example.test/docs/");
    assertEqual(result.value.canonicalUrl, "https://example.test/docs/guide");
    assertDeepEqual(
      result.value.links.map(item => item.resolvedUrl),
      ["https://example.test/docs/a", "https://example.test/b?x=1&y=2"]
    );
  });

  test("does not discover fake links inside script content", () => {
    const tags = scanStartTags(`<script>const x = "<a href='https://evil.test'>";</script><a href="/safe">safe</a>`);
    assertEqual(tags.filter(tag => tag.name === "a").length, 1);
  });
});

describe("M3 bounded fetcher", () => {
  test("returns accepted HTML with final response metadata", async () => {
    const encoder = new TextEncoder();
    const response = {
      status: 200,
      url: "https://example.test/docs",
      redirected: false,
      headers: new Map([["content-type", "text/html"]]),
      arrayBuffer: async () => encoder.encode("<p>ok</p>").buffer
    };
    const result = await fetchHtmlPage(
      { url: "https://example.test/docs", timeoutMs: 1000, maxHtmlBytes: 1000 },
      { fetchImpl: async () => response }
    );
    assertResultOk(result);
    assertEqual(result.value.finalUrl, "https://example.test/docs");
    assertEqual(result.value.html, "<p>ok</p>");
  });

  test("returns a structured skip for non-HTML responses", async () => {
    const response = {
      status: 200,
      url: "https://example.test/manual.pdf",
      redirected: false,
      headers: new Map([["content-type", "application/pdf"]]),
      arrayBuffer: async () => new ArrayBuffer(0)
    };
    const result = await fetchHtmlPage(
      { url: "https://example.test/manual.pdf" },
      { fetchImpl: async () => response }
    );
    assertResultError(result, "NON_HTML_RESPONSE");
    assertEqual(result.error.details.disposition, "SKIP");
  });
});

describe("M3 fetch-discovery queue integration", () => {
  test("fetches one task, stores HTML, and queues only M1-approved links", async () => {
    const crawlId = "crawl_test";
    const config = createCrawlConfig({
      startUrl: "https://example.test/docs/",
      allowedOrigin: "https://example.test",
      allowedPathPrefix: "/docs",
      maxPages: 5,
      maxDepth: 2,
      requestDelayMs: 0,
      retryLimit: 1
    }, crawlId, 1).value;
    let run = createCrawlRun(crawlId, 1).value;
    run = applyRunTransition(run, CRAWL_EVENTS.PLAN_READY, 2).value;
    run = applyRunTransition(run, CRAWL_EVENTS.START, 3).value;
    run.nextTaskSequence = 2;
    run.nextDiscoverySequence = 2;

    const queue = createPriorityTaskQueue({ maxSize: config.maxPages });
    queue.enqueue(createTaskRecord({
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
    }, 1).value);

    const snapshot = {
      schemaVersion: 1,
      config,
      run,
      queue: queue.snapshot(),
      fetchRecords: [],
      events: [],
      requestCache: []
    };
    let storedHtml = null;
    const result = await processNextNetworkTask(snapshot, {
      now: () => 10,
      persistSnapshot: async value => success(structuredClone(value)),
      putFetchedHtml: async value => {
        storedHtml = value;
        return success({ stored: true });
      },
      fetchPage: async () => success({
        requestedUrl: "https://example.test/docs/",
        finalUrl: "https://example.test/docs/",
        status: 200,
        contentType: "text/html",
        htmlByteLength: 100,
        redirected: false,
        html: `<a href="/docs/a">A</a><a href="https://outside.test/docs/b">outside</a>`,
        fetchedAt: 10,
        durationMs: 1
      })
    });

    assertResultOk(result);
    assertEqual(result.value.action, "FETCHED");
    assertTrue(Boolean(storedHtml));
    assertEqual(result.value.snapshot.run.counts.fetched, 1);
    assertEqual(result.value.snapshot.run.counts.queued, 1);
    assertEqual(result.value.snapshot.fetchRecords[0].acceptedLinkCount, 1);
  });
});
