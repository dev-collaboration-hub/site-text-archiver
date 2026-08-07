const ENTITY_MAP = Object.freeze({
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " "
});

export function decodeHtmlEntities(value = "") {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) {
      const code = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (lower.startsWith("#")) {
      const code = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITY_MAP[lower] ?? match;
  });
}

export function normalizeWhitespace(value = "") {
  return String(value).replace(/[\t\r\n\f ]+/g, " ").trim();
}

export function getAttribute(node, name) {
  if (!node || node.type !== "element") return null;
  const target = String(name).toLowerCase();
  const entry = Object.entries(node.attributes ?? {}).find(([key]) => key.toLowerCase() === target);
  return entry ? entry[1] : null;
}

export function hasAttribute(node, name) {
  if (!node || node.type !== "element") return false;
  const target = String(name).toLowerCase();
  return Object.keys(node.attributes ?? {}).some(key => key.toLowerCase() === target);
}

export function classTokens(node) {
  return normalizeWhitespace(getAttribute(node, "class") ?? "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean);
}

export function idTokens(node) {
  return normalizeWhitespace(getAttribute(node, "id") ?? "")
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter(Boolean);
}

export function walkNodes(node, callback, path = "") {
  if (!node) return;
  callback(node, path);
  if (!Array.isArray(node.children)) return;
  let elementIndex = 0;
  for (const child of node.children) {
    const childName = child.type === "element" ? child.tagName : child.type;
    const childPath = `${path}/${childName}[${elementIndex}]`;
    walkNodes(child, callback, childPath);
    elementIndex += 1;
  }
}

export function findElements(node, predicate) {
  const output = [];
  walkNodes(node, (candidate, path) => {
    if (candidate.type === "element" && predicate(candidate)) output.push({ node: candidate, path });
  });
  return output;
}

export function firstElement(node, predicate) {
  let found = null;
  walkNodes(node, (candidate, path) => {
    if (!found && candidate.type === "element" && predicate(candidate)) found = { node: candidate, path };
  });
  return found;
}

export function textContent(node, options = {}) {
  const preserveWhitespace = options.preserveWhitespace === true;
  const parts = [];
  walkNodes(node, candidate => {
    if (candidate.type === "text") parts.push(candidate.value ?? "");
    if (candidate.type === "element" && ["br", "p", "div", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6"].includes(candidate.tagName)) {
      parts.push("\n");
    }
  });
  const joined = parts.join("");
  return preserveWhitespace ? joined : normalizeWhitespace(joined);
}

export function directChildren(node, tagName = null) {
  const children = Array.isArray(node?.children) ? node.children.filter(child => child.type === "element") : [];
  return tagName ? children.filter(child => child.tagName === tagName) : children;
}

export function cloneNode(node) {
  if (!node || typeof node !== "object") return node;
  if (node.type === "text") return { type: "text", value: node.value ?? "" };
  return {
    type: node.type,
    tagName: node.tagName,
    attributes: { ...(node.attributes ?? {}) },
    children: Array.isArray(node.children) ? node.children.map(cloneNode) : []
  };
}

export function elementCount(node, tags = null) {
  let count = 0;
  const tagSet = tags ? new Set(tags) : null;
  walkNodes(node, candidate => {
    if (candidate.type === "element" && (!tagSet || tagSet.has(candidate.tagName))) count += 1;
  });
  return count;
}

export function linkTextLength(node) {
  let length = 0;
  for (const { node: link } of findElements(node, candidate => candidate.tagName === "a")) {
    length += textContent(link).length;
  }
  return length;
}
