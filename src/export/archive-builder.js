import { pageToMarkdown } from "./markdown-converter.js";
import { orderPageRecords } from "./page-ordering.js";
import { buildCrawlReport, buildFailureReport } from "./report-generator.js";
import { buildArchiveToc, tocToMarkdown } from "./toc-builder.js";

export const ARCHIVE_BUILD_VERSION = 1;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    const output = {};
    for (const key of Object.keys(value).sort()) output[key] = stableValue(value[key]);
    return output;
  }
  return value;
}

export function stableStringify(value, space = 2) {
  return JSON.stringify(stableValue(value), null, space) + "\n";
}

function snapshotTimestamp(snapshot) {
  return snapshot?.run?.completedAt ?? snapshot?.run?.updatedAt ?? snapshot?.run?.createdAt ?? null;
}

function markdownHeader(snapshot, title) {
  const lines = [`# ${title}`];
  if (snapshot?.config?.startUrl) lines.push(`> Start URL: ${snapshot.config.startUrl}`);
  if (snapshot?.run?.crawlId) lines.push(`> Crawl ID: ${snapshot.run.crawlId}`);
  const timestamp = snapshotTimestamp(snapshot);
  if (Number.isFinite(timestamp)) lines.push(`> Snapshot: ${new Date(timestamp).toISOString()}`);
  if (snapshot?.config?.allowedOrigin) {
    lines.push(`> Scope: ${snapshot.config.allowedOrigin}${snapshot.config.allowedPathPrefix ?? "/"}`);
  }
  return lines.join("\n");
}

export function buildArchive(snapshot, pageRecords = [], options = {}) {
  if (!snapshot?.run || !snapshot?.config) throw new TypeError("A persisted crawl snapshot is required");
  const orderedPages = orderPageRecords(pageRecords, snapshot.config.startUrl);
  const toc = buildArchiveToc(orderedPages);
  const archiveTitle = options.title ?? "Site Text Archive";
  const pageMarkdown = orderedPages.map((page, index) => pageToMarkdown(page, {
    pageHeadingLevel: 2,
    displayTitle: toc[index].displayTitle
  }).trim());
  const warningCount = orderedPages.reduce((sum, page) => sum + (page.extractionWarnings?.length ?? 0), 0);
  const markdownParts = [markdownHeader(snapshot, archiveTitle)];
  const tocMarkdown = tocToMarkdown(toc);
  if (tocMarkdown) markdownParts.push(tocMarkdown);
  for (const markdown of pageMarkdown) markdownParts.push("---", markdown);
  if (warningCount > 0) markdownParts.push("---", `## Warnings summary\n\n${warningCount} extraction warning(s) are preserved in the JSON archive.`);
  const markdown = markdownParts.join("\n\n").trim() + "\n";

  const crawlReport = buildCrawlReport(snapshot, orderedPages, options.softwareVersion ?? null);
  const failureReport = buildFailureReport(snapshot);
  const jsonArchive = {
    archiveVersion: ARCHIVE_BUILD_VERSION,
    crawl: {
      crawlId: snapshot.run.crawlId,
      lifecycle: snapshot.run.lifecycle,
      startUrl: snapshot.config.startUrl,
      allowedOrigin: snapshot.config.allowedOrigin,
      allowedPathPrefix: snapshot.config.allowedPathPrefix,
      snapshotAt: snapshotTimestamp(snapshot)
    },
    toc,
    pageOrder: orderedPages.map(page => page.pageId),
    pages: orderedPages.map((page, index) => ({
      ...page,
      finalMarkdown: pageMarkdown[index] + "\n"
    })),
    warnings: {
      extractionWarningCount: warningCount
    }
  };

  const files = {
    "documentation.md": { mediaType: "text/markdown;charset=utf-8", content: markdown },
    "documentation.json": { mediaType: "application/json;charset=utf-8", content: stableStringify(jsonArchive) },
    "crawl-report.json": { mediaType: "application/json;charset=utf-8", content: stableStringify(crawlReport) }
  };
  if (failureReport.count > 0 || options.includeEmptyFailureReport === true) {
    files["failed-pages.json"] = { mediaType: "application/json;charset=utf-8", content: stableStringify(failureReport) };
  }

  return {
    markdown,
    json: jsonArchive,
    pageOrder: orderedPages.map(page => page.pageId),
    toc,
    warnings: warningCount,
    crawlReport,
    failureReport,
    files,
    buildVersion: ARCHIVE_BUILD_VERSION
  };
}
