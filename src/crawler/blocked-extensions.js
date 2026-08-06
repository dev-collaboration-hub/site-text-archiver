export const DEFAULT_BLOCKED_EXTENSIONS = Object.freeze([
  "7z",
  "avi",
  "bin",
  "bz2",
  "csv",
  "dmg",
  "doc",
  "docx",
  "exe",
  "gif",
  "gz",
  "ico",
  "iso",
  "jpeg",
  "jpg",
  "mov",
  "mp3",
  "mp4",
  "msi",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "rar",
  "svg",
  "tar",
  "tgz",
  "webm",
  "webp",
  "xls",
  "xlsx",
  "xml",
  "zip"
]);

export function getPathExtension(urlInput) {
  try {
    const pathname = (urlInput instanceof URL
      ? urlInput
      : new URL(String(urlInput))).pathname;
    const lastSegment = pathname.split("/").pop() ?? "";
    const dotIndex = lastSegment.lastIndexOf(".");

    return dotIndex > 0 && dotIndex < lastSegment.length - 1
      ? lastSegment.slice(dotIndex + 1).toLowerCase()
      : "";
  } catch {
    return "";
  }
}

export function isBlockedExtension(
  urlInput,
  blockedExtensions = DEFAULT_BLOCKED_EXTENSIONS
) {
  const values = Array.isArray(blockedExtensions)
    ? blockedExtensions
    : DEFAULT_BLOCKED_EXTENSIONS;
  const blocked = new Set(
    values.map(item => String(item).replace(/^\./, "").toLowerCase())
  );
  const extension = getPathExtension(urlInput);

  return {
    blocked: extension !== "" && blocked.has(extension),
    extension
  };
}
