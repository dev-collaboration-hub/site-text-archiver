import { escapeTableCell } from "./markdown-escape.js";

function normalizeWidth(headers, rows) {
  return Math.max(headers.length, ...rows.map(row => row.length), 0);
}

function normalizedRow(row, width) {
  return Array.from({ length: width }, (_, index) => escapeTableCell(row[index] ?? ""));
}

export function renderMarkdownTable(block = {}) {
  const rows = Array.isArray(block.rows) ? block.rows : [];
  const headers = Array.isArray(block.headers) ? block.headers : [];
  const width = normalizeWidth(headers, rows);
  if (width === 0) return "";

  const normalizedHeaders = headers.length
    ? normalizedRow(headers, width)
    : Array.from({ length: width }, (_, index) => `Column ${index + 1}`);
  const output = [];
  if (block.caption) output.push(`**${escapeTableCell(block.caption)}**`, "");
  output.push(`| ${normalizedHeaders.join(" | ")} |`);
  output.push(`| ${normalizedHeaders.map(() => "---").join(" | ")} |`);
  for (const row of rows) output.push(`| ${normalizedRow(row, width).join(" | ")} |`);
  return output.join("\n");
}
