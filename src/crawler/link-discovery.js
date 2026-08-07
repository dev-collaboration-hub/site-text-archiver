import { failure, success } from "../shared/result.js";

function isNameChar(character) {
  return Boolean(character) && /[A-Za-z0-9:_-]/.test(character);
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

export function scanStartTags(html) {
  const source = String(html ?? "");
  const lower = source.toLowerCase();
  const tags = [];
  let index = 0;

  while (index < source.length) {
    const open = source.indexOf("<", index);
    if (open < 0) break;
    if (source.startsWith("<!--", open)) {
      const end = source.indexOf("-->", open + 4);
      index = end < 0 ? source.length : end + 3;
      continue;
    }
    let cursor = open + 1;
    if (["/", "!", "?"].includes(source[cursor])) {
      const end = source.indexOf(">", cursor + 1);
      index = end < 0 ? source.length : end + 1;
      continue;
    }
    while (/\s/.test(source[cursor] ?? "")) cursor++;
    const nameStart = cursor;
    while (isNameChar(source[cursor])) cursor++;
    if (cursor === nameStart) { index = open + 1; continue; }
    const name = source.slice(nameStart, cursor).toLowerCase();
    const attrs = {};

    while (cursor < source.length) {
      while (/\s/.test(source[cursor] ?? "")) cursor++;
      if (source[cursor] === ">") { cursor++; break; }
      if (source[cursor] === "/" && source[cursor + 1] === ">") { cursor += 2; break; }
      const attrStart = cursor;
      while (cursor < source.length && !/[\s=/>]/.test(source[cursor])) cursor++;
      if (cursor === attrStart) { cursor++; continue; }
      const attrName = source.slice(attrStart, cursor).toLowerCase();
      while (/\s/.test(source[cursor] ?? "")) cursor++;
      let attrValue = "";
      if (source[cursor] === "=") {
        cursor++;
        while (/\s/.test(source[cursor] ?? "")) cursor++;
        const quote = source[cursor] === '"' || source[cursor] === "'" ? source[cursor++] : null;
        const valueStart = cursor;
        if (quote) {
          while (cursor < source.length && source[cursor] !== quote) cursor++;
          attrValue = source.slice(valueStart, cursor);
          if (source[cursor] === quote) cursor++;
        } else {
          while (cursor < source.length && !/[\s>]/.test(source[cursor])) cursor++;
          attrValue = source.slice(valueStart, cursor);
        }
      }
      if (!(attrName in attrs)) attrs[attrName] = decodeHtmlEntities(attrValue);
    }

    tags.push({ name, attrs, index: open });
    index = cursor;
    if (name === "script" || name === "style") {
      const close = lower.indexOf(`</${name}`, index);
      if (close >= 0) index = close;
    }
  }
  return tags;
}

function resolveCandidate(raw, baseUrl) {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  try { return new URL(raw.trim(), baseUrl).href; } catch { return null; }
}

export function discoverPageLinks(html, pageUrl) {
  let absolutePageUrl;
  try { absolutePageUrl = new URL(String(pageUrl)).href; }
  catch { return failure("INVALID_PAGE_URL", "Page URL must be absolute"); }

  const tags = scanStartTags(html);
  let baseUrl = absolutePageUrl;
  const warnings = [];
  const baseTag = tags.find(tag => tag.name === "base" && typeof tag.attrs.href === "string");
  if (baseTag) {
    const resolvedBase = resolveCandidate(baseTag.attrs.href, absolutePageUrl);
    if (resolvedBase) baseUrl = resolvedBase;
    else warnings.push({ code: "INVALID_BASE_URL", value: baseTag.attrs.href });
  }

  let canonicalUrl = null;
  for (const tag of tags) {
    if (tag.name !== "link" || !tag.attrs.href) continue;
    const relTokens = String(tag.attrs.rel ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    if (relTokens.includes("canonical")) {
      canonicalUrl = resolveCandidate(tag.attrs.href, baseUrl);
      if (!canonicalUrl) warnings.push({ code: "INVALID_CANONICAL_URL", value: tag.attrs.href });
      break;
    }
  }

  const seen = new Set();
  const links = [];
  for (const tag of tags) {
    if ((tag.name !== "a" && tag.name !== "area") || !tag.attrs.href) continue;
    const resolvedUrl = resolveCandidate(tag.attrs.href, baseUrl);
    if (!resolvedUrl || seen.has(resolvedUrl)) continue;
    seen.add(resolvedUrl);
    links.push({ href: tag.attrs.href, resolvedUrl, discoveryOrder: links.length + 1 });
  }

  return success({ pageUrl: absolutePageUrl, baseUrl, canonicalUrl, links, warnings });
}
