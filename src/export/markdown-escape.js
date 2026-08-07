export function escapeMarkdownText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/([`*_{}\[\]<>#+.!|])/g, "\\$1")
    .replace(/(^|\n)(\s*)([-+>])/g, "$1$2\\$3");
}

export function escapeLinkText(value = "") {
  return escapeMarkdownText(value).replace(/\)/g, "\\)");
}

export function escapeLinkDestination(value = "") {
  return encodeURI(String(value).trim())
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\s/g, "%20");
}

export function escapeTableCell(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " / ")
    .trim();
}

export function headingSlug(value = "") {
  const normalized = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[`*_{}\[\]()<>#+.!|:'"?,/\\]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "section";
}
