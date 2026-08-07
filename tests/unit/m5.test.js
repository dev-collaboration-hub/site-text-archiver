import { assertDeepEqual, assertEqual, assertTrue } from "../assertions.js";
import { describe, test } from "../test-runner.js";
import { buildArchive } from "../../src/export/archive-builder.js";
import { renderCodeBlock } from "../../src/export/code-fence.js";

function fixture() {
  const snapshot = {
    config: { crawlId: "crawl_m5", startUrl: "https://example.test/docs/start", allowedOrigin: "https://example.test", allowedPathPrefix: "/docs", maxPages: 10, maxDepth: 3 },
    run: { crawlId: "crawl_m5", lifecycle: "COMPLETED", startedAt: 100, completedAt: 500, createdAt: 50, updatedAt: 500 },
    queue: { tasks: [
      { taskId: "t1", url: "https://example.test/docs/start", state: "EXTRACTED", attempt: 0, depth: 0, discoveryOrder: 1 },
      { taskId: "t2", url: "https://example.test/docs/missing", state: "SKIPPED", reasonCode: "HTTP_NOT_FOUND", attempt: 0, depth: 1, discoveryOrder: 2 }
    ] },
    fetchRecords: [{ taskId: "t1", htmlByteLength: 123 }]
  };
  const pages = [{
    pageId: "page_t1", crawlId: "crawl_m5", taskId: "t1",
    url: "https://example.test/docs/start", canonicalUrl: "https://example.test/docs/start",
    title: "Guide", depth: 0, discoverySequence: 1, navigationSequence: null,
    extractionWarnings: [],
    blocks: [
      { type: "heading", originalLevel: 1, text: "Start" },
      { type: "code-block", language: "js", code: "const x = '```';" },
      { type: "table", headers: ["A", "B"], rows: [["x|y", "1"]] }
    ]
  }];
  return { snapshot, pages };
}

describe("M5 deterministic archive export", () => {
  test("same snapshot produces byte-stable files", () => {
    const { snapshot, pages } = fixture();
    const a = buildArchive(snapshot, pages, { softwareVersion: "0.6.0" });
    const b = buildArchive(structuredClone(snapshot), structuredClone(pages), { softwareVersion: "0.6.0" });
    assertDeepEqual(a.files, b.files);
    assertEqual(a.pageOrder[0], "page_t1");
    assertTrue(a.markdown.includes("> Source: https://example.test/docs/start"));
    assertTrue(a.markdown.includes("x\\|y"));
    assertEqual(a.failureReport.count, 1);
  });

  test("code fences expand past embedded backticks", () => {
    assertTrue(renderCodeBlock("x```y", "js").startsWith("````js"));
  });
});
