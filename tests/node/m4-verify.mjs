import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { parseHtml } from "../../src/extraction/html-parser.js";
import { cleanDocument } from "../../src/extraction/dom-cleaner.js";
import { detectMainContent } from "../../src/extraction/main-content-detector.js";
import { extractSemanticContent } from "../../src/extraction/content-extractor.js";
import { extractPageFromHtml } from "../../src/extraction/extraction-pipeline.js";
import { findElements, textContent } from "../../src/extraction/dom-utils.js";
import { TASK_STATES } from "../../src/crawler/task-record.js";

const fixture = `<!doctype html><html lang="en"><head><title>Guide</title><meta name="description" content="D"><link rel="canonical" href="/docs/guide"></head><body><nav><a href="/x">X</a><a href="/y">Y</a></nav><main id="docs"><h1>Guide</h1><p>Read <code>config.js</code> and <a href="/docs/api">API</a>.</p><h3>Steps</h3><ul><li>One<ul><li>Nested</li></ul></li></ul><pre class="language-js"><code>const x = 1;\n  x++;</code></pre><table><tr><th>A</th><th>B</th></tr><tr><td rowspan="2">x</td><td>1</td></tr><tr><td>2</td></tr></table><div class="callout warning">Warn</div><p hidden>hidden</p><script>const fake = "<main>bad</main>";</script></main><footer>footer</footer></body></html>`;

const parsed = parseHtml(fixture);
assert.equal(parsed.ok, true);
const cleaned = cleanDocument(parsed.value.document);
assert.equal(cleaned.ok, true);
assert.equal(findElements(cleaned.value.document, node => node.tagName === "script").length, 0);
assert.equal(textContent(cleaned.value.document).includes("hidden"), false);

const selected = detectMainContent(cleaned.value.document);
assert.equal(selected.ok, true);
assert.equal(selected.value.selectedRoots[0].node.tagName, "main");

const extracted = extractSemanticContent(cleaned.value.document, selected.value.selectedRoots, "https://example.test/docs/guide");
assert.equal(extracted.ok, true);
assert.equal(extracted.value.metadata.title, "Guide");
assert.equal(extracted.value.metadata.canonicalLink, "https://example.test/docs/guide");
assert.ok(extracted.value.blocks.some(block => block.type === "code-block" && block.language === "js"));
assert.ok(extracted.value.blocks.some(block => block.type === "table" && block.rows[1][0] === "x"));
assert.ok(extracted.value.blocks.some(block => block.type === "callout"));
assert.ok(extracted.value.warnings.some(warning => warning.code === "HEADING_LEVEL_JUMP"));

const task = {
  taskId: "task_crawl_test_1",
  crawlId: "crawl_test",
  url: "https://example.test/docs/guide",
  canonicalKey: "https://example.test/docs/guide",
  parentUrl: null,
  depth: 0,
  priorityScore: 100,
  discoveryOrder: 1,
  attempt: 0,
  state: TASK_STATES.FETCHED,
  availableAt: 0,
  reasonCode: null,
  createdAt: 0,
  updatedAt: 0
};
const page = await extractPageFromHtml({
  html: fixture,
  task,
  url: task.url,
  canonicalUrl: task.url,
  fetchedAt: 10,
  extractedAt: 20
}, { cryptoObject: webcrypto });
assert.equal(page.ok, true);
assert.ok(page.value.contentHash.startsWith("sha256:"));
assert.ok(page.value.structureHash.startsWith("sha256:"));
assert.equal(Object.hasOwn(page.value, "html"), false);
assert.ok(page.value.markdown.includes("# Guide"));

console.log(`M4 verification passed: ${page.value.blocks.length} semantic blocks, ${page.value.extractionWarnings.length} warnings.`);
