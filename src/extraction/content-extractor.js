import {
  classTokens,
  directChildren,
  findElements,
  firstElement,
  getAttribute,
  normalizeWhitespace,
  textContent
} from "./dom-utils.js";
import { failure, success } from "../shared/result.js";

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const CALLOUT_TOKENS = new Set(["callout", "admonition", "notice", "warning", "tip", "note", "important"]);

function resolveLink(rawUrl, sourceUrl) {
  try {
    return new URL(rawUrl, sourceUrl).href;
  } catch {
    return null;
  }
}

function inlineParts(node, sourceUrl) {
  const output = [];
  function pushText(value) {
    if (!value) return;
    const previous = output[output.length - 1];
    if (previous?.type === "text") previous.text += value;
    else output.push({ type: "text", text: value });
  }
  function visit(candidate) {
    if (candidate.type === "text") {
      pushText(candidate.value ?? "");
      return;
    }
    if (candidate.type !== "element") return;
    if (candidate.tagName === "code") {
      output.push({ type: "code", text: textContent(candidate, { preserveWhitespace: true }) });
      return;
    }
    if (candidate.tagName === "a") {
      const text = normalizeWhitespace(textContent(candidate));
      const url = resolveLink(getAttribute(candidate, "href") ?? "", sourceUrl);
      if (text) output.push({ type: "link", text, url });
      return;
    }
    if (candidate.tagName === "br") {
      pushText("\n");
      return;
    }
    for (const child of candidate.children ?? []) visit(child);
  }
  for (const child of node.children ?? []) visit(child);
  return output.map(part => part.type === "text" ? { ...part, text: part.text.replace(/[\t\r\f ]+/g, " ") } : part)
    .filter(part => part.type !== "text" || part.text.length > 0);
}

function languageHint(node) {
  const tokens = classTokens(node);
  for (const token of tokens) {
    const match = /^(?:language|lang)-(.+)$/.exec(token);
    if (match) return match[1].toLowerCase();
  }
  const code = firstElement(node, candidate => candidate.tagName === "code")?.node;
  if (code) return languageHint(code);
  return null;
}

function extractList(node, sourceUrl, headingPath) {
  function extractItem(li) {
    const inline = [];
    const children = [];
    for (const child of li.children ?? []) {
      if (child.type === "element" && (child.tagName === "ul" || child.tagName === "ol")) {
        children.push(extractList(child, sourceUrl, headingPath));
      } else if (child.type === "text") {
        inline.push({ type: "text", text: child.value ?? "" });
      } else if (child.type === "element") {
        inline.push(...inlineParts({ ...child, children: child.children ?? [] }, sourceUrl));
      }
    }
    const text = normalizeWhitespace(inline.map(part => part.text ?? "").join(" "));
    return { text, inline, children };
  }
  return {
    type: node.tagName === "ol" ? "ordered-list" : "unordered-list",
    headingPath: [...headingPath],
    items: directChildren(node, "li").map(extractItem),
    text: directChildren(node, "li").map(li => normalizeWhitespace(textContent(li))).filter(Boolean).join("\n"),
    warnings: []
  };
}

function extractTable(node, headingPath) {
  const rowNodes = findElements(node, candidate => candidate.tagName === "tr").map(entry => entry.node);
  const grid = [];
  const warnings = [];
  let headerRowIndex = -1;

  for (let r = 0; r < rowNodes.length; r += 1) {
    grid[r] ??= [];
    let column = 0;
    const cells = directChildren(rowNodes[r]).filter(cell => cell.tagName === "th" || cell.tagName === "td");
    if (cells.some(cell => cell.tagName === "th") && headerRowIndex === -1) headerRowIndex = r;
    for (const cell of cells) {
      while (grid[r][column] !== undefined) column += 1;
      const text = normalizeWhitespace(textContent(cell));
      const rowspan = Math.max(1, Number.parseInt(getAttribute(cell, "rowspan") ?? "1", 10) || 1);
      const colspan = Math.max(1, Number.parseInt(getAttribute(cell, "colspan") ?? "1", 10) || 1);
      if (rowspan > 50 || colspan > 50) {
        warnings.push({ code: "COMPLEX_TABLE_FALLBACK", rowspan, colspan });
        grid[r][column] = text;
        column += 1;
        continue;
      }
      for (let rr = r; rr < r + rowspan; rr += 1) {
        grid[rr] ??= [];
        for (let cc = column; cc < column + colspan; cc += 1) {
          if (grid[rr][cc] !== undefined) warnings.push({ code: "COMPLEX_TABLE_FALLBACK", row: rr, column: cc });
          else grid[rr][cc] = text;
        }
      }
      column += colspan;
    }
  }

  const width = grid.reduce((max, row) => Math.max(max, row.length), 0);
  const normalized = grid.map(row => Array.from({ length: width }, (_, index) => row[index] ?? ""));
  const headers = headerRowIndex >= 0 ? normalized[headerRowIndex] : [];
  const rows = normalized.filter((_row, index) => index !== headerRowIndex);
  const caption = normalizeWhitespace(textContent(directChildren(node, "caption")[0] ?? { children: [] }));
  return {
    type: "table",
    headingPath: [...headingPath],
    caption: caption || null,
    headers,
    rows,
    text: [caption, headers.join(" | "), ...rows.map(row => row.join(" | "))].filter(Boolean).join("\n"),
    warnings
  };
}

function metadataFromDocument(documentNode, sourceUrl) {
  const html = firstElement(documentNode, node => node.tagName === "html")?.node;
  const title = normalizeWhitespace(textContent(firstElement(documentNode, node => node.tagName === "title")?.node ?? { children: [] }));
  const meta = findElements(documentNode, node => node.tagName === "meta").map(entry => entry.node);
  function metaValue(names) {
    for (const node of meta) {
      const key = (getAttribute(node, "name") ?? getAttribute(node, "property") ?? "").toLowerCase();
      if (names.includes(key)) return normalizeWhitespace(getAttribute(node, "content") ?? "") || null;
    }
    return null;
  }
  const canonicalNode = findElements(documentNode, node => node.tagName === "link").map(entry => entry.node)
    .find(node => (getAttribute(node, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"));
  return {
    title: title || null,
    language: normalizeWhitespace(getAttribute(html, "lang") ?? "") || null,
    description: metaValue(["description", "og:description"]),
    author: metaValue(["author", "article:author"]),
    canonicalLink: canonicalNode ? resolveLink(getAttribute(canonicalNode, "href") ?? "", sourceUrl) : null
  };
}

function calloutType(node) {
  const matched = classTokens(node).find(token => CALLOUT_TOKENS.has(token));
  return matched ?? null;
}

export function extractSemanticContent(documentNode, selectedRoots, sourceUrl) {
  if (!documentNode || !Array.isArray(selectedRoots) || selectedRoots.length === 0) {
    return failure("EMPTY_EXTRACTION", "Semantic extraction requires selected content roots");
  }
  const metadata = metadataFromDocument(documentNode, sourceUrl);
  const blocks = [];
  const headings = [];
  const links = [];
  const warnings = [];
  const headingStack = [];
  let previousHeadingLevel = 0;

  function addBlock(block, sourcePath) {
    const order = blocks.length;
    blocks.push({ order, sourcePath, ...block });
  }

  function visit(node, path) {
    if (node.type !== "element") return;
    if (HEADING_TAGS.has(node.tagName)) {
      const level = Number(node.tagName.slice(1));
      const text = normalizeWhitespace(textContent(node));
      if (!text) {
        warnings.push({ code: "EMPTY_HEADING", sourcePath: path });
        return;
      }
      if (previousHeadingLevel && level > previousHeadingLevel + 1) {
        warnings.push({ code: "HEADING_LEVEL_JUMP", from: previousHeadingLevel, to: level, sourcePath: path });
      }
      headingStack.length = level - 1;
      headingStack[level - 1] = text;
      const headingPath = headingStack.filter(Boolean);
      headings.push({ text, originalLevel: level, headingPath: [...headingPath], order: blocks.length });
      addBlock({
        type: "heading",
        text,
        originalLevel: level,
        normalizedLevel: level,
        headingPath: [...headingPath],
        warnings: []
      }, path);
      previousHeadingLevel = level;
      return;
    }

    if (node.tagName === "pre") {
      const code = textContent(node, { preserveWhitespace: true }).replace(/^\n|\n$/g, "");
      if (code) addBlock({ type: "code-block", text: code, code, language: languageHint(node), headingPath: headingStack.filter(Boolean), warnings: [] }, path);
      return;
    }

    if (node.tagName === "p") {
      const text = normalizeWhitespace(textContent(node));
      if (text) {
        const inline = inlineParts(node, sourceUrl);
        for (const part of inline) if (part.type === "link" && part.url) links.push({ text: part.text, url: part.url, blockOrder: blocks.length });
        addBlock({ type: "paragraph", text, inline, headingPath: headingStack.filter(Boolean), warnings: [] }, path);
      }
      return;
    }

    if (node.tagName === "ul" || node.tagName === "ol") {
      addBlock(extractList(node, sourceUrl, headingStack.filter(Boolean)), path);
      return;
    }

    if (node.tagName === "table") {
      const table = extractTable(node, headingStack.filter(Boolean));
      warnings.push(...table.warnings.map(warning => ({ ...warning, sourcePath: path })));
      addBlock(table, path);
      return;
    }

    if (node.tagName === "blockquote") {
      const text = normalizeWhitespace(textContent(node));
      if (text) addBlock({ type: "blockquote", text, headingPath: headingStack.filter(Boolean), warnings: [] }, path);
      return;
    }

    if (node.tagName === "hr") {
      addBlock({ type: "horizontal-rule", text: "", headingPath: headingStack.filter(Boolean), warnings: [] }, path);
      return;
    }

    const callout = calloutType(node);
    if (callout) {
      const text = normalizeWhitespace(textContent(node));
      if (text) addBlock({ type: "callout", calloutType: callout, text, headingPath: headingStack.filter(Boolean), warnings: [] }, path);
      return;
    }

    if (node.tagName === "img") {
      const alt = normalizeWhitespace(getAttribute(node, "alt") ?? "");
      if (alt) addBlock({ type: "image-alt-text", text: alt, headingPath: headingStack.filter(Boolean), warnings: [] }, path);
      return;
    }

    let childIndex = 0;
    for (const child of node.children ?? []) {
      if (child.type === "element") visit(child, `${path}/${child.tagName}[${childIndex}]`);
      childIndex += 1;
    }
  }

  for (const root of selectedRoots) visit(root.node, root.path || "/root");
  const meaningful = blocks.filter(block => block.type !== "horizontal-rule" && normalizeWhitespace(block.text ?? "").length > 0);
  if (meaningful.length === 0) return failure("EMPTY_EXTRACTION", "Selected content contained no semantic blocks");

  const plainText = meaningful.map(block => block.text).filter(Boolean).join("\n\n");
  return success({
    metadata,
    headings,
    blocks,
    links,
    plainText,
    warnings
  });
}
