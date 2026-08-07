import { classTokens, cloneNode, getAttribute, hasAttribute, idTokens } from "./dom-utils.js";
import { failure, success } from "../shared/result.js";

const REMOVE_TAGS = new Set([
  "script", "style", "noscript", "template", "iframe", "object", "embed",
  "input", "button", "select", "textarea", "option"
]);
const UI_TOKENS = new Set([
  "breadcrumb", "breadcrumbs", "cookie", "cookies", "modal", "popup", "advertisement", "ads"
]);

function inlineHidden(node) {
  const style = (getAttribute(node, "style") ?? "").toLowerCase().replace(/\s+/g, "");
  return style.includes("display:none") || style.includes("visibility:hidden") || style.includes("opacity:0");
}

function shouldRemove(node) {
  if (node.type !== "element") return false;
  if (REMOVE_TAGS.has(node.tagName)) return true;
  if (node.tagName === "canvas" && !node.children?.length) return true;
  if (hasAttribute(node, "hidden")) return true;
  if ((getAttribute(node, "aria-hidden") ?? "").toLowerCase() === "true") return true;
  if (inlineHidden(node)) return true;
  const tokens = [...classTokens(node), ...idTokens(node)];
  return tokens.some(token => UI_TOKENS.has(token));
}

export function cleanDocument(documentNode) {
  if (!documentNode || documentNode.type !== "document") {
    return failure("HTML_PARSE_FAILED", "DOM cleaner requires a parsed document");
  }
  const stats = { removedNodes: 0, hiddenNodes: 0, removedByTag: {} };

  function clean(node) {
    if (node.type === "text") return cloneNode(node);
    if (shouldRemove(node)) {
      stats.removedNodes += 1;
      if (node.type === "element") {
        stats.removedByTag[node.tagName] = (stats.removedByTag[node.tagName] ?? 0) + 1;
        if (hasAttribute(node, "hidden") || (getAttribute(node, "aria-hidden") ?? "").toLowerCase() === "true" || inlineHidden(node)) {
          stats.hiddenNodes += 1;
        }
      }
      return null;
    }
    const copy = {
      type: node.type,
      tagName: node.tagName,
      attributes: { ...(node.attributes ?? {}) },
      children: []
    };
    for (const child of node.children ?? []) {
      const cleaned = clean(child);
      if (cleaned) copy.children.push(cleaned);
    }
    return copy;
  }

  return success({ document: clean(documentNode), removalStats: stats, warnings: [] });
}
