import { failure, success } from "../shared/result.js";
import { applyQueryPolicy } from "./query-policy.js";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);
const ENCODED_BYTE_PATTERN = /%([0-9a-fA-F]{2})/g;

function decodeUnreserved(pathname) {
  return pathname.replace(ENCODED_BYTE_PATTERN, (match, hex) => {
    const character = String.fromCharCode(Number.parseInt(hex, 16));
    return /[A-Za-z0-9\-._~]/.test(character)
      ? character
      : match.toUpperCase();
  });
}

function normalizePathname(pathname) {
  const collapsed = pathname.replace(/\/{2,}/g, "/");
  const decoded = decodeUnreserved(collapsed || "/");
  return decoded.length > 1 && decoded.endsWith("/")
    ? decoded.slice(0, -1)
    : decoded;
}

export function createCanonicalKey(normalizedUrl) {
  try {
    const parsed = normalizedUrl instanceof URL
      ? normalizedUrl
      : new URL(String(normalizedUrl));
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export function normalizeUrl(urlInput, policy = {}) {
  let url;
  try {
    url = urlInput instanceof URL
      ? new URL(urlInput.href)
      : new URL(String(urlInput).trim());
  } catch {
    return failure("INVALID_URL", "URL could not be normalized");
  }

  if (!SUPPORTED_PROTOCOLS.has(url.protocol)) {
    return failure(
      "UNSUPPORTED_PROTOCOL",
      "Only HTTP and HTTPS URLs are supported",
      false,
      { protocol: url.protocol }
    );
  }

  url.hash = "";
  url.pathname = normalizePathname(url.pathname);

  const queryResult = applyQueryPolicy(url, policy.queryPolicy ?? policy);
  if (!queryResult.ok) {
    return queryResult;
  }

  url = queryResult.value.url;
  const normalizedUrl = url.href;

  return success({
    originalUrl: String(urlInput),
    normalizedUrl,
    canonicalKey: createCanonicalKey(url),
    removedParameters: queryResult.value.removedParameters,
    warnings: []
  });
}
