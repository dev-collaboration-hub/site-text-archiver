import { SCHEMA_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { DEFAULT_BLOCKED_EXTENSIONS } from "./blocked-extensions.js";
import { DEFAULT_REMOVABLE_QUERY_PARAMETERS } from "./query-policy.js";

export const CRAWL_LIMITS = Object.freeze({
  maxPages: Object.freeze([1, 10000]),
  maxDepth: Object.freeze([0, 100]),
  requestDelayMs: Object.freeze([0, 60000]),
  retryLimit: Object.freeze([0, 10]),
  fetchTimeoutMs: Object.freeze([1000, 120000]),
  maxHtmlBytes: Object.freeze([1024, 25_000_000]),
  maxPatterns: 100,
  maxPatternLength: 512
});

function validateInteger(value, field, [minimum, maximum]) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    return failure("INVALID_CRAWL_CONFIG", `${field} must be an integer between ${minimum} and ${maximum}`, false, { field, value });
  }
  return success(value);
}

function normalizePatterns(input, field) {
  const values = Array.isArray(input) ? input : [];
  const output = [...new Set(values.filter(value => typeof value === "string").map(value => value.trim()).filter(Boolean))];
  if (output.length > CRAWL_LIMITS.maxPatterns) {
    return failure("INVALID_CRAWL_CONFIG", `${field} contains too many patterns`, false, { field, maximum: CRAWL_LIMITS.maxPatterns });
  }
  const invalid = output.find(value => value.length > CRAWL_LIMITS.maxPatternLength);
  if (invalid) {
    return failure("INVALID_CRAWL_CONFIG", `${field} contains an oversized pattern`, false, { field, maximumLength: CRAWL_LIMITS.maxPatternLength });
  }
  return success(output);
}

function normalizePathPrefix(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return "/";
  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return prefixed.length > 1 && prefixed.endsWith("/") ? prefixed.slice(0, -1) : prefixed;
}

export function createCrawlConfig(input, crawlId, now = Date.now()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return failure("INVALID_CRAWL_CONFIG", "Crawl config must be an object");
  }
  if (typeof crawlId !== "string" || crawlId.length === 0) {
    return failure("INVALID_CRAWL_CONFIG", "crawlId is required", false, { field: "crawlId" });
  }

  let startUrl;
  try {
    startUrl = new URL(String(input.startUrl ?? "").trim());
  } catch {
    return failure("INVALID_CRAWL_CONFIG", "startUrl must be a valid absolute URL", false, { field: "startUrl" });
  }
  if (!["http:", "https:"].includes(startUrl.protocol)) {
    return failure("INVALID_CRAWL_CONFIG", "startUrl must use HTTP or HTTPS", false, { field: "startUrl" });
  }

  let allowedOrigin;
  try {
    allowedOrigin = new URL(String(input.allowedOrigin || startUrl.origin)).origin;
  } catch {
    return failure("INVALID_CRAWL_CONFIG", "allowedOrigin must be a valid origin", false, { field: "allowedOrigin" });
  }
  if (allowedOrigin !== startUrl.origin) {
    return failure("ORIGIN_MISMATCH", "Allowed origin must match start URL origin", false, { allowedOrigin, startOrigin: startUrl.origin });
  }

  const numericDefaults = {
    maxPages: 100,
    maxDepth: 5,
    requestDelayMs: 500,
    retryLimit: 2,
    fetchTimeoutMs: 15000,
    maxHtmlBytes: 5_000_000
  };
  const numeric = {};
  for (const field of Object.keys(numericDefaults)) {
    const value = input[field] ?? numericDefaults[field];
    const checked = validateInteger(value, field, CRAWL_LIMITS[field]);
    if (!checked.ok) return checked;
    numeric[field] = checked.value;
  }

  const includePatterns = normalizePatterns(input.includePatterns, "includePatterns");
  if (!includePatterns.ok) return includePatterns;
  const excludePatterns = normalizePatterns(input.excludePatterns, "excludePatterns");
  if (!excludePatterns.ok) return excludePatterns;

  const blockedExtensions = [...new Set((Array.isArray(input.blockedExtensions) ? input.blockedExtensions : DEFAULT_BLOCKED_EXTENSIONS)
    .map(value => String(value).trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean))];

  return success({
    schemaVersion: SCHEMA_VERSION,
    crawlId,
    startUrl: startUrl.href,
    allowedOrigin,
    allowedPathPrefix: normalizePathPrefix(input.allowedPathPrefix),
    ...numeric,
    includePatterns: includePatterns.value,
    excludePatterns: excludePatterns.value,
    blockedExtensions,
    queryPolicy: {
      removableParameters: input.queryPolicy?.removableParameters ?? DEFAULT_REMOVABLE_QUERY_PARAMETERS,
      retainedParameters: input.queryPolicy?.retainedParameters ?? [],
      removeEmptyParameters: input.queryPolicy?.removeEmptyParameters !== false
    },
    createdAt: now,
    updatedAt: now
  });
}
