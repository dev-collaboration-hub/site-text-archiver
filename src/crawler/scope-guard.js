import { isBlockedExtension } from "./blocked-extensions.js";
import { inspectUnsafeAction } from "./link-safety.js";

function decision(allowed, reasonCode, evidence = {}) {
  return Object.freeze({
    allowed,
    reasonCode,
    evidence: Object.freeze({ ...evidence })
  });
}

function normalizePathPrefix(value) {
  const trimmed = typeof value === "string" && value.trim()
    ? value.trim()
    : "/";
  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return prefixed.length > 1 && prefixed.endsWith("/")
    ? prefixed.slice(0, -1)
    : prefixed;
}

function pathIsWithin(pathname, prefix) {
  return prefix === "/" || pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function globMatches(value, pattern) {
  if (typeof pattern !== "string" || pattern.length === 0) {
    return false;
  }

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(escaped, "i").test(value);
}

export function evaluateUrlScope(normalizedUrl, config = {}, context = {}) {
  let url;
  try {
    url = normalizedUrl instanceof URL
      ? normalizedUrl
      : new URL(String(normalizedUrl));
  } catch {
    return decision(false, "INVALID_URL", {
      normalizedUrl: String(normalizedUrl)
    });
  }

  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    return decision(false, "UNSUPPORTED_PROTOCOL", {
      protocol: url.protocol
    });
  }

  if (typeof config.allowedOrigin !== "string" || config.allowedOrigin.length === 0) {
    return decision(false, "INVALID_SCOPE_CONFIG", {
      field: "allowedOrigin"
    });
  }

  if (url.origin !== config.allowedOrigin) {
    return decision(false, "OUTSIDE_ORIGIN", {
      expectedOrigin: config.allowedOrigin,
      actualOrigin: url.origin
    });
  }

  const allowedPathPrefix = normalizePathPrefix(config.allowedPathPrefix);
  if (!pathIsWithin(url.pathname, allowedPathPrefix)) {
    return decision(false, "OUTSIDE_PATH", {
      allowedPathPrefix,
      actualPath: url.pathname
    });
  }

  const target = `${url.pathname}${url.search}`;
  const includePatterns = Array.isArray(config.includePatterns)
    ? config.includePatterns.filter(Boolean)
    : [];

  if (
    includePatterns.length > 0 &&
    !includePatterns.some(pattern => globMatches(target, pattern))
  ) {
    return decision(false, "INCLUDE_PATTERN_MISS", {
      includePatterns
    });
  }

  const excludePatterns = Array.isArray(config.excludePatterns)
    ? config.excludePatterns.filter(Boolean)
    : [];
  const matchedExclude = excludePatterns.find(pattern => globMatches(target, pattern));

  if (matchedExclude) {
    return decision(false, "EXCLUDED_PATTERN", {
      matchedPattern: matchedExclude
    });
  }

  const extensionResult = isBlockedExtension(url, config.blockedExtensions);
  if (extensionResult.blocked) {
    return decision(false, "BLOCKED_EXTENSION", {
      extension: extensionResult.extension
    });
  }

  const unsafeResult = inspectUnsafeAction(url, config.unsafeActionPatterns);
  if (unsafeResult.unsafe) {
    return decision(false, "UNSAFE_ACTION_LINK", unsafeResult);
  }

  if (
    Number.isInteger(context.depth) &&
    Number.isInteger(config.maxDepth) &&
    context.depth > config.maxDepth
  ) {
    return decision(false, "MAX_DEPTH_REACHED", {
      depth: context.depth,
      maxDepth: config.maxDepth
    });
  }

  if (
    Number.isInteger(context.currentPageCount) &&
    Number.isInteger(config.maxPages) &&
    context.currentPageCount >= config.maxPages
  ) {
    return decision(false, "MAX_PAGE_LIMIT", {
      currentPageCount: context.currentPageCount,
      maxPages: config.maxPages
    });
  }

  if (context.registry?.has?.(context.canonicalKey)) {
    return decision(false, "DUPLICATE_URL", {
      canonicalKey: context.canonicalKey,
      existingState: context.registry.getState?.(context.canonicalKey) ?? null
    });
  }

  return decision(true, "ALLOWED", {
    origin: url.origin,
    path: url.pathname
  });
}
