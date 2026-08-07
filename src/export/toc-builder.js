import { headingSlug } from "./markdown-escape.js";

export function buildArchiveToc(pageRecords = []) {
  const used = new Map();
  return pageRecords.map((page, index) => {
    const baseTitle = page.title ?? page.url ?? `Page ${index + 1}`;
    const baseSlug = headingSlug(baseTitle);
    const occurrence = (used.get(baseSlug) ?? 0) + 1;
    used.set(baseSlug, occurrence);
    const displayTitle = occurrence === 1 ? baseTitle : `${baseTitle} (${occurrence})`;
    return {
      pageId: page.pageId,
      title: baseTitle,
      displayTitle,
      anchor: headingSlug(displayTitle),
      url: page.canonicalUrl ?? page.url ?? null,
      order: index
    };
  });
}

export function tocToMarkdown(toc = []) {
  if (!Array.isArray(toc) || toc.length === 0) return "";
  return ["## Table of contents", "", ...toc.map(item => `${item.order + 1}. [${item.displayTitle}](#${item.anchor})`)].join("\n");
}
