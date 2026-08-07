export function sanitizeFileName(value, fallback = "export") {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "-")
    .replace(/\.\.+/g, ".")
    .replace(/^\.+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return normalized || fallback;
}

export function sanitizeDownloadPath(value) {
  return String(value ?? "")
    .split(/[\\/]+/)
    .filter(Boolean)
    .map(part => sanitizeFileName(part, "export"))
    .join("/");
}
