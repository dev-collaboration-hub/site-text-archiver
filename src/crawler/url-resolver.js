import { failure, success } from "../shared/result.js";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

export function resolveUrl(rawUrl, parentUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return failure("INVALID_URL", "URL must be a non-empty string");
  }

  try {
    const resolved = parentUrl
      ? new URL(rawUrl.trim(), parentUrl)
      : new URL(rawUrl.trim());

    if (!SUPPORTED_PROTOCOLS.has(resolved.protocol)) {
      return failure(
        "UNSUPPORTED_PROTOCOL",
        "Only HTTP and HTTPS URLs are supported",
        false,
        { protocol: resolved.protocol }
      );
    }

    return success({ originalUrl: rawUrl, resolvedUrl: resolved.href });
  } catch {
    return failure("INVALID_URL", "URL could not be resolved", false, {
      rawUrl,
      parentUrl: parentUrl ?? null
    });
  }
}
