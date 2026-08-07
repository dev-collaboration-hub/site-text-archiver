import { failure, success } from "../shared/result.js";
import { sanitizeDownloadPath } from "./file-names.js";

export function createTextDataUrl(content, mediaType = "text/plain;charset=utf-8") {
  return `data:${mediaType},${encodeURIComponent(String(content))}`;
}

export async function downloadArchiveFiles(files, downloadsApi = globalThis.chrome?.downloads, options = {}) {
  if (!files || typeof files !== "object" || Array.isArray(files)) {
    return failure("INVALID_EXPORT_FILES", "Export files must be an object");
  }
  if (!downloadsApi || typeof downloadsApi.download !== "function") {
    return failure("DOWNLOAD_RUNTIME_UNAVAILABLE", "Browser downloads API is unavailable");
  }

  const results = [];
  const prefix = options.prefix ? `${sanitizeDownloadPath(options.prefix)}/` : "";
  try {
    for (const [name, file] of Object.entries(files)) {
      if (!file || typeof file.content !== "string") continue;
      const filename = `${prefix}${sanitizeDownloadPath(name)}`;
      const downloadId = await downloadsApi.download({
        url: createTextDataUrl(file.content, file.mediaType),
        filename,
        saveAs: options.saveAs === true,
        conflictAction: "uniquify"
      });
      results.push({ filename, downloadId });
    }
    return success({ count: results.length, downloads: results });
  } catch (error) {
    return failure("DOWNLOAD_FAILED", "Archive file download failed", true, {
      completed: results,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
