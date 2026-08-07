import { renderCodeBlock, renderInlineCode } from "./code-fence.js";
import { escapeLinkDestination, escapeLinkText, escapeMarkdownText } from "./markdown-escape.js";
import { renderMarkdownTable } from "./table-renderer.js";

function clampHeading(level) {
  return Math.max(1, Math.min(6, Number.isInteger(level) ? level : 1));
}

function renderInline(parts = [], fallback = "") {
  if (!Array.isArray(parts) || parts.length === 0) return escapeMarkdownText(fallback);
  return parts.map(part => {
    if (part?.type === "code") return renderInlineCode(part.text ?? "");
    if (part?.type === "link") {
      const text = escapeLinkText(part.text ?? part.url ?? "link");
      return part.url ? `[${text}](${escapeLinkDestination(part.url)})` : text;
    }
    return escapeMarkdownText(part?.text ?? "");
  }).join("").trim();
}

function renderList(block, depth = 0) {
  const ordered = block.type === "ordered-list";
  const output = [];
  const items = Array.isArray(block.items) ? block.items : [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] ?? {};
    const indent = "  ".repeat(depth);
    const marker = ordered ? `${index + 1}.` : "-";
    output.push(`${indent}${marker} ${renderInline(item.inline, item.text ?? "")}`.trimEnd());
    for (const child of item.children ?? []) {
      const nested = renderList(child, depth + 1);
      if (nested) output.push(nested);
    }
  }
  return output.join("\n");
}

export function blockToMarkdown(block, context = {}) {
  if (!block || typeof block !== "object") return "";
  switch (block.type) {
    case "heading": {
      const level = clampHeading((block.originalLevel ?? 1) + (context.headingOffset ?? 0));
      return `${"#".repeat(level)} ${escapeMarkdownText(block.text ?? "")}`;
    }
    case "paragraph":
      return renderInline(block.inline, block.text ?? "");
    case "code-block":
      return renderCodeBlock(block.code ?? block.text ?? "", block.language);
    case "ordered-list":
    case "unordered-list":
      return renderList(block);
    case "table":
      return renderMarkdownTable(block);
    case "blockquote":
    case "callout":
      return String(block.text ?? "").split(/\r?\n/).map(line => `> ${line}`).join("\n");
    case "horizontal-rule":
      return "---";
    case "image-alt-text":
      return `Image: ${escapeMarkdownText(block.text ?? "")}`;
    default:
      return escapeMarkdownText(block.text ?? "");
  }
}

export function pageToMarkdown(pageRecord, options = {}) {
  if (!pageRecord || typeof pageRecord !== "object") throw new TypeError("pageRecord is required");
  const title = options.displayTitle ?? pageRecord.title ?? pageRecord.url ?? "Untitled page";
  const pageHeadingLevel = clampHeading(options.pageHeadingLevel ?? 1);
  const internalBase = Math.min(6, pageHeadingLevel + 1);
  const sourceUrl = pageRecord.canonicalUrl ?? pageRecord.url ?? "";
  const blocks = Array.isArray(pageRecord.blocks) ? pageRecord.blocks : [];
  const output = [
    `${"#".repeat(pageHeadingLevel)} ${escapeMarkdownText(title)}`,
    sourceUrl ? `> Source: ${sourceUrl}` : ""
  ].filter(Boolean);

  for (const block of blocks) {
    const original = block?.originalLevel ?? 1;
    const target = Math.min(6, internalBase + Math.max(0, original - 1));
    const rendered = blockToMarkdown(block, { headingOffset: target - original });
    if (rendered.trim()) output.push(rendered);
  }
  return output.join("\n\n").trim() + "\n";
}
