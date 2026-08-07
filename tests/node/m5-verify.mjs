import assert from "node:assert/strict";
import { buildArchive } from "../../src/export/archive-builder.js";
import { renderCodeBlock } from "../../src/export/code-fence.js";
import { downloadArchiveFiles } from "../../src/export/download-adapter.js";
import { pageToMarkdown } from "../../src/export/markdown-converter.js";
import { sanitizeDownloadPath } from "../../src/export/file-names.js";

const snapshot = {
  schemaVersion: 1,
  config: {
    crawlId: "crawl_m5",
    startUrl: "https://example.test/docs/start",
    allowedOrigin: "https://example.test",
    allowedPathPrefix: "/docs",
    maxPages: 10,
    maxDepth: 3
  },
  run: {
    crawlId: "crawl_m5",
    lifecycle: "COMPLETED",
    startedAt: 100,
    completedAt: 500,
    createdAt: 50,
    updatedAt: 500
  },
  queue: {
    tasks: [
      { taskId: "t1", url: "https://example.test/docs/start", parentUrl: null, state: "EXTRACTED", reasonCode: null, attempt: 0, depth: 0, discoveryOrder: 1, createdAt: 50, updatedAt: 300 },
      { taskId: "t2", url: "https://example.test/docs/second", parentUrl: "https://example.test/docs/start", state: "EXTRACTED", reasonCode: null, attempt: 1, depth: 1, discoveryOrder: 2, createdAt: 60, updatedAt: 350 },
      { taskId: "t3", url: "https://example.test/docs/manual.pdf", parentUrl: "https://example.test/docs/start", state: "SKIPPED", reasonCode: "NON_HTML_RESPONSE", attempt: 0, depth: 1, discoveryOrder: 3, createdAt: 70, updatedAt: 250 }
    ]
  },
  fetchRecords: [
    { taskId: "t1", htmlByteLength: 100 },
    { taskId: "t2", htmlByteLength: 200 }
  ]
};

const pages = [
  {
    pageId: "page_t2",
    crawlId: "crawl_m5",
    taskId: "t2",
    url: "https://example.test/docs/second",
    canonicalUrl: "https://example.test/docs/second",
    title: "Guide",
    blocks: [
      { type: "heading", originalLevel: 1, text: "Second", headingPath: ["Second"] },
      { type: "paragraph", text: "Second page" }
    ],
    extractionWarnings: [],
    depth: 1,
    discoverySequence: 2,
    navigationSequence: null
  },
  {
    pageId: "page_t1",
    crawlId: "crawl_m5",
    taskId: "t1",
    url: "https://example.test/docs/start",
    canonicalUrl: "https://example.test/docs/start",
    title: "Guide",
    blocks: [
      { type: "heading", originalLevel: 1, text: "Start", headingPath: ["Start"] },
      { type: "paragraph", text: "Use config.js", inline: [{ type: "text", text: "Use " }, { type: "code", text: "config.js" }] },
      { type: "code-block", language: "js", code: "const fence = '```';" },
      { type: "table", headers: ["Name", "Value"], rows: [["a|b", "1"]] }
    ],
    extractionWarnings: [{ code: "HEADING_LEVEL_JUMP" }],
    depth: 0,
    discoverySequence: 1,
    navigationSequence: null
  }
];

const first = buildArchive(snapshot, pages, { softwareVersion: "0.6.0" });
const second = buildArchive(structuredClone(snapshot), structuredClone(pages), { softwareVersion: "0.6.0" });
assert.deepEqual(first.files, second.files);
assert.deepEqual(first.pageOrder, ["page_t1", "page_t2"]);
assert.equal(first.toc[0].anchor, "guide");
assert.equal(first.toc[1].anchor, "guide-2");
assert.ok(first.markdown.includes("> Source: https://example.test/docs/start"));
assert.ok(first.markdown.includes("````js\nconst fence = '```';\n````"));
assert.ok(first.markdown.includes("a\\|b"));
assert.ok(first.files["failed-pages.json"]);
assert.equal(first.failureReport.count, 1);
assert.equal(first.failureReport.items[0].errorCode, "NON_HTML_RESPONSE");
assert.equal(first.crawlReport.fetchedBytes, 300);
assert.equal(first.crawlReport.retries.totalRetryAttempts, 1);

const standalone = pageToMarkdown(pages[1]);
assert.ok(standalone.startsWith("# Guide\n"));
assert.ok(standalone.includes("## Start"));
assert.equal(renderCodeBlock("x```y").startsWith("````"), true);
assert.equal(sanitizeDownloadPath("../unsafe\\name.json").includes(".."), false);

const calls = [];
const downloadsApi = {
  async download(options) {
    calls.push(options);
    return calls.length;
  }
};
const downloaded = await downloadArchiveFiles(first.files, downloadsApi);
assert.equal(downloaded.ok, true);
assert.equal(downloaded.value.count, 4);
assert.equal(calls[0].filename, "documentation.md");
assert.ok(calls[0].url.startsWith("data:text/markdown"));

console.log(`M5 verification passed: ${first.pageOrder.length} pages, ${downloaded.value.count} files, ${first.failureReport.count} failure record.`);
