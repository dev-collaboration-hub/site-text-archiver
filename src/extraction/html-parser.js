import { decodeHtmlEntities } from "./dom-utils.js";
import { failure, success } from "../shared/result.js";

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"
]);
const RAW_TEXT_ELEMENTS = new Set(["script", "style"]);

function parseAttributes(source) {
  const attributes = {};
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (index >= source.length || source[index] === "/") break;

    const nameMatch = /^[^\s=/>]+/.exec(source.slice(index));
    if (!nameMatch) break;
    const name = nameMatch[0].toLowerCase();
    index += nameMatch[0].length;
    while (/\s/.test(source[index] ?? "")) index += 1;

    let value = "";
    if (source[index] === "=") {
      index += 1;
      while (/\s/.test(source[index] ?? "")) index += 1;
      const quote = source[index];
      if (quote === "\"" || quote === "'") {
        index += 1;
        const end = source.indexOf(quote, index);
        if (end === -1) {
          value = source.slice(index);
          index = source.length;
        } else {
          value = source.slice(index, end);
          index = end + 1;
        }
      } else {
        const valueMatch = /^[^\s>]+/.exec(source.slice(index));
        value = valueMatch?.[0] ?? "";
        index += value.length;
      }
    }
    attributes[name] = decodeHtmlEntities(value);
  }
  return attributes;
}

function appendText(parent, value) {
  if (!value) return;
  const decoded = decodeHtmlEntities(value);
  const previous = parent.children[parent.children.length - 1];
  if (previous?.type === "text") previous.value += decoded;
  else parent.children.push({ type: "text", value: decoded });
}

export function parseHtml(html) {
  if (typeof html !== "string") return failure("HTML_PARSE_FAILED", "HTML source must be a string");

  const documentNode = { type: "document", tagName: "#document", attributes: {}, children: [] };
  const stack = [documentNode];
  const warnings = [];
  let index = 0;

  try {
    while (index < html.length) {
      const parent = stack[stack.length - 1];
      if (parent.type === "element" && RAW_TEXT_ELEMENTS.has(parent.tagName)) {
        const closeNeedle = `</${parent.tagName}`;
        const lower = html.toLowerCase();
        const closeIndex = lower.indexOf(closeNeedle, index);
        if (closeIndex === -1) {
          appendText(parent, html.slice(index));
          warnings.push({ code: "UNCLOSED_RAW_TEXT", tagName: parent.tagName });
          break;
        }
        appendText(parent, html.slice(index, closeIndex));
        index = closeIndex;
        continue;
      }

      const lt = html.indexOf("<", index);
      if (lt === -1) {
        appendText(parent, html.slice(index));
        break;
      }
      if (lt > index) appendText(parent, html.slice(index, lt));

      if (html.startsWith("<!--", lt)) {
        const end = html.indexOf("-->", lt + 4);
        index = end === -1 ? html.length : end + 3;
        if (end === -1) warnings.push({ code: "UNCLOSED_COMMENT" });
        continue;
      }
      if (/^<!doctype/i.test(html.slice(lt, lt + 10))) {
        const end = html.indexOf(">", lt + 2);
        index = end === -1 ? html.length : end + 1;
        continue;
      }

      const gt = html.indexOf(">", lt + 1);
      if (gt === -1) {
        appendText(parent, html.slice(lt));
        warnings.push({ code: "UNCLOSED_TAG_TOKEN" });
        break;
      }
      const token = html.slice(lt + 1, gt);
      index = gt + 1;

      if (token.startsWith("/")) {
        const closeName = token.slice(1).trim().split(/\s+/)[0]?.toLowerCase();
        if (!closeName) continue;
        let matched = -1;
        for (let i = stack.length - 1; i > 0; i -= 1) {
          if (stack[i].tagName === closeName) { matched = i; break; }
        }
        if (matched !== -1) stack.splice(matched);
        else warnings.push({ code: "UNMATCHED_END_TAG", tagName: closeName });
        continue;
      }

      if (token.startsWith("!") || token.startsWith("?")) continue;
      const selfClosing = /\/\s*$/.test(token);
      const nameMatch = /^\s*([^\s/>]+)/.exec(token);
      if (!nameMatch) continue;
      const tagName = nameMatch[1].toLowerCase();
      const attributeSource = token.slice(nameMatch.index + nameMatch[0].length);
      const node = {
        type: "element",
        tagName,
        attributes: parseAttributes(attributeSource),
        children: []
      };
      parent.children.push(node);
      if (!selfClosing && !VOID_ELEMENTS.has(tagName)) stack.push(node);
    }

    if (stack.length > 1) {
      warnings.push({ code: "AUTO_CLOSED_ELEMENTS", count: stack.length - 1 });
    }
    return success({ document: documentNode, warnings });
  } catch (error) {
    return failure("HTML_PARSE_FAILED", "HTML could not be parsed", false, {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
