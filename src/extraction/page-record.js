import { normalizeWhitespace } from "./dom-utils.js";
import { failure, success } from "../shared/result.js";
import { SCHEMA_VERSION } from "../shared/constants.js";

export const EXTRACTION_VERSION = 1;

function markdownEscape(value) {
  return String(value).replace(/([\\`*_{}\[\]()<>#+.!|-])/g, "\\$1");
}

export function semanticBlocksToMarkdown(blocks = []) {
  const output = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        output.push(`${"#".repeat(Math.max(1, Math.min(6, block.originalLevel ?? 1)))} ${block.text}`);
        break;
      case "paragraph":
        output.push(block.text);
        break;
      case "code-block":
        output.push(`\`\`\`${block.language ?? ""}\n${block.code ?? block.text ?? ""}\n\`\`\``);
        break;
      case "ordered-list":
      case "unordered-list": {
        const ordered = block.type === "ordered-list";
        output.push((block.items ?? []).map((item, index) => `${ordered ? `${index + 1}.` : "-"} ${item.text}`).join("\n"));
        break;
      }
      case "table": {
        const headers = block.headers?.length ? block.headers : (block.rows?.[0]?.map((_value, index) => `Column ${index + 1}`) ?? []);
        if (headers.length) {
          output.push(`| ${headers.map(markdownEscape).join(" | ")} |`);
          output.push(`| ${headers.map(() => "---").join(" | ")} |`);
          for (const row of block.rows ?? []) output.push(`| ${row.map(markdownEscape).join(" | ")} |`);
        }
        break;
      }
      case "blockquote":
      case "callout":
        output.push(block.text.split("\n").map(line => `> ${line}`).join("\n"));
        break;
      case "horizontal-rule":
        output.push("---");
        break;
      case "image-alt-text":
        output.push(`[Image: ${block.text}]`);
        break;
      default:
        if (normalizeWhitespace(block.text ?? "")) output.push(block.text);
    }
  }
  return output.filter(value => String(value).trim().length > 0).join("\n\n");
}

async function sha256(value, cryptoObject = globalThis.crypto) {
  if (!cryptoObject?.subtle?.digest) return failure("HASH_RUNTIME_UNAVAILABLE", "Web Crypto digest is unavailable");
  const bytes = new TextEncoder().encode(String(value));
  const digest = await cryptoObject.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  return success(`sha256:${hex}`);
}

export async function buildPageRecord(input, dependencies = {}) {
  if (!input?.task || !input?.extraction || typeof input.url !== "string") {
    return failure("INVALID_PAGE_RECORD", "Page record input is incomplete");
  }
  const now = Number.isSafeInteger(input.extractedAt) ? input.extractedAt : Date.now();
  const pageId = `page_${input.task.taskId}`;
  const blocks = input.extraction.blocks.map((block, order) => ({
    blockId: `${pageId}:block:${order}`,
    ...block,
    order
  }));
  const plainText = input.extraction.plainText;
  const markdown = semanticBlocksToMarkdown(blocks);
  const contentHash = await sha256(normalizeWhitespace(plainText).toLowerCase(), dependencies.cryptoObject);
  if (!contentHash.ok) return contentHash;
  const structureSignature = blocks.map(block => `${block.type}:${block.originalLevel ?? ""}:${(block.headingPath ?? []).join(">")}`).join("|");
  const structureHash = await sha256(structureSignature, dependencies.cryptoObject);
  if (!structureHash.ok) return structureHash;
  const metadata = input.extraction.metadata ?? {};
  const warnings = [
    ...(input.parseWarnings ?? []),
    ...(input.cleanWarnings ?? []),
    ...(input.selectionWarnings ?? []),
    ...(input.extraction.warnings ?? [])
  ];

  return success({
    schemaVersion: SCHEMA_VERSION,
    extractionVersion: EXTRACTION_VERSION,
    pageId,
    crawlId: input.task.crawlId,
    taskId: input.task.taskId,
    url: input.url,
    canonicalUrl: metadata.canonicalLink ?? input.canonicalUrl ?? input.url,
    title: metadata.title ?? input.extraction.headings?.[0]?.text ?? input.url,
    language: metadata.language ?? null,
    metadata: {
      description: metadata.description ?? null,
      canonicalLink: metadata.canonicalLink ?? null,
      author: metadata.author ?? null
    },
    headings: input.extraction.headings.map(heading => ({ ...heading })),
    blocks,
    links: input.extraction.links.map(link => ({ ...link })),
    plainText,
    markdown,
    contentHash: contentHash.value,
    structureHash: structureHash.value,
    quality: {
      score: null,
      band: null,
      dimensions: {},
      warnings: [],
      policyVersion: 0
    },
    duplicate: {
      exactDuplicateOf: null,
      nearDuplicateOf: null,
      similarity: 0
    },
    boilerplateRatio: null,
    extractionWarnings: warnings,
    extractionEvidence: input.extractionEvidence ?? {},
    depth: input.task.depth,
    discoverySequence: input.task.discoveryOrder,
    navigationSequence: null,
    fetchedAt: input.fetchedAt ?? null,
    extractedAt: now,
    createdAt: now,
    updatedAt: now
  });
}
