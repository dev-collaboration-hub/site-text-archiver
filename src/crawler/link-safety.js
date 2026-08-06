export const DEFAULT_UNSAFE_ACTION_PATTERNS = Object.freeze([
  "logout",
  "log-out",
  "signout",
  "sign-out",
  "delete",
  "remove-account",
  "unsubscribe",
  "purchase",
  "checkout",
  "billing",
  "revoke",
  "reset-password"
]);

const ACTION_QUERY_KEYS = new Set([
  "action",
  "command",
  "do",
  "operation",
  "task"
]);

function normalizeToken(value) {
  try {
    return decodeURIComponent(value)
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
  } catch {
    return String(value).trim().toLowerCase().replace(/[_\s]+/g, "-");
  }
}

export function inspectUnsafeAction(
  urlInput,
  patterns = DEFAULT_UNSAFE_ACTION_PATTERNS
) {
  let url;
  try {
    url = urlInput instanceof URL ? urlInput : new URL(String(urlInput));
  } catch {
    return { unsafe: false, matchedPattern: null, location: null };
  }

  const normalizedPatterns = new Set(patterns.map(normalizeToken));
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map(normalizeToken);

  for (const segment of segments) {
    for (const pattern of normalizedPatterns) {
      if (segment === pattern || segment.startsWith(`${pattern}.`)) {
        return { unsafe: true, matchedPattern: pattern, location: "path" };
      }
    }
  }

  for (const [key, value] of url.searchParams.entries()) {
    if (!ACTION_QUERY_KEYS.has(key.toLowerCase())) {
      continue;
    }

    const normalizedValue = normalizeToken(value);
    if (normalizedPatterns.has(normalizedValue)) {
      return {
        unsafe: true,
        matchedPattern: normalizedValue,
        location: `query:${key}`
      };
    }
  }

  return { unsafe: false, matchedPattern: null, location: null };
}
