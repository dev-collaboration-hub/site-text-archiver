import { failure, success } from "../shared/result.js";

const HTML_TYPES = new Set(["text/html", "application/xhtml+xml"]);
const RETRYABLE_STATUSES = new Set([408, 425, 429]);

export function normalizeContentType(value) {
  return String(value ?? "").split(";", 1)[0].trim().toLowerCase();
}

export function parseRetryAfter(value, now = Date.now()) {
  if (value == null || value === "") return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const timestamp = Date.parse(String(value));
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now) : null;
}

export function classifyHttpResponse(input = {}) {
  const status = Number(input.status);
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    return failure("INVALID_HTTP_STATUS", "HTTP status is invalid", false, { status: input.status });
  }
  const contentType = normalizeContentType(input.contentType);
  const contentLength = Number(input.contentLength);
  const maxHtmlBytes = Number.isInteger(input.maxHtmlBytes) ? input.maxHtmlBytes : 5_000_000;
  const retryAfterMs = parseRetryAfter(input.retryAfter, input.now ?? Date.now());

  if (status >= 200 && status < 300) {
    if (status === 204 || status === 205) {
      return success({ disposition: "SKIP", reasonCode: "EMPTY_RESPONSE", recoverable: false, retryAfterMs: null });
    }
    if (!HTML_TYPES.has(contentType)) {
      return success({ disposition: "SKIP", reasonCode: "NON_HTML_RESPONSE", recoverable: false, retryAfterMs: null });
    }
    if (Number.isFinite(contentLength) && contentLength > maxHtmlBytes) {
      return success({ disposition: "SKIP", reasonCode: "HTML_SIZE_LIMIT", recoverable: false, retryAfterMs: null });
    }
    return success({ disposition: "ACCEPT", reasonCode: "HTML_ACCEPTED", recoverable: false, retryAfterMs: null });
  }

  if (RETRYABLE_STATUSES.has(status) || status >= 500) {
    const reasonCode = status === 429 ? "HTTP_RATE_LIMITED" : status >= 500 ? "HTTP_SERVER_ERROR" : "HTTP_RETRYABLE_STATUS";
    return success({ disposition: "RETRY", reasonCode, recoverable: true, retryAfterMs });
  }
  if (status === 404) return success({ disposition: "SKIP", reasonCode: "HTTP_NOT_FOUND", recoverable: false, retryAfterMs: null });
  if (status === 401 || status === 403) return success({ disposition: "SKIP", reasonCode: "HTTP_ACCESS_DENIED", recoverable: false, retryAfterMs: null });
  if (status >= 300 && status < 400) return success({ disposition: "SKIP", reasonCode: "HTTP_REDIRECT_UNRESOLVED", recoverable: false, retryAfterMs: null });
  if (status >= 400 && status < 500) return success({ disposition: "SKIP", reasonCode: "HTTP_CLIENT_ERROR", recoverable: false, retryAfterMs: null });
  return success({ disposition: "SKIP", reasonCode: "HTTP_UNSUPPORTED_STATUS", recoverable: false, retryAfterMs: null });
}
