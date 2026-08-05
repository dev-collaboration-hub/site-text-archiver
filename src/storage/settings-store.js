import { STORAGE_KEYS } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";

export const DEFAULT_SETTINGS = Object.freeze({
  startUrl: "",
  allowedOrigin: "",
  allowedPathPrefix: "/",
  maxPages: 100,
  maxDepth: 5,
  requestDelayMs: 500,
  retryLimit: 2,
  excludePatterns: []
});

const LIMITS = Object.freeze({
  maxPages: [1, 10000],
  maxDepth: [0, 100],
  requestDelayMs: [0, 60000],
  retryLimit: [0, 10]
});

function clampInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, parsed));
}

function normalizePathPrefix(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    return "/";
  }
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

export function normalizeSettings(input = {}) {
  const value = input && typeof input === "object" ? input : {};
  const excludePatterns = Array.isArray(value.excludePatterns)
    ? value.excludePatterns
        .filter(item => typeof item === "string")
        .map(item => item.trim())
        .filter(Boolean)
    : [];

  return {
    startUrl: typeof value.startUrl === "string" ? value.startUrl.trim() : "",
    allowedOrigin: typeof value.allowedOrigin === "string" ? value.allowedOrigin.trim() : "",
    allowedPathPrefix: normalizePathPrefix(value.allowedPathPrefix),
    maxPages: clampInteger(value.maxPages, DEFAULT_SETTINGS.maxPages, ...LIMITS.maxPages),
    maxDepth: clampInteger(value.maxDepth, DEFAULT_SETTINGS.maxDepth, ...LIMITS.maxDepth),
    requestDelayMs: clampInteger(
      value.requestDelayMs,
      DEFAULT_SETTINGS.requestDelayMs,
      ...LIMITS.requestDelayMs
    ),
    retryLimit: clampInteger(value.retryLimit, DEFAULT_SETTINGS.retryLimit, ...LIMITS.retryLimit),
    excludePatterns: [...new Set(excludePatterns)]
  };
}

export function validateSettings(input) {
  const settings = normalizeSettings(input);
  if (!settings.startUrl) {
    return failure("START_URL_REQUIRED", "Start URL is required");
  }

  let parsed;
  try {
    parsed = new URL(settings.startUrl);
  } catch {
    return failure("INVALID_START_URL", "Start URL is not valid");
  }

  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    return failure("UNSUPPORTED_START_URL", "Start URL must use HTTP or HTTPS");
  }

  if (!settings.allowedOrigin) {
    settings.allowedOrigin = parsed.origin;
  }

  if (settings.allowedOrigin !== parsed.origin) {
    return failure("ORIGIN_MISMATCH", "Allowed origin must match the start URL origin");
  }

  return success(settings);
}

export async function loadSettings(storageArea = chrome.storage.local) {
  try {
    const stored = await storageArea.get(STORAGE_KEYS.SETTINGS);
    return success(normalizeSettings(stored[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS));
  } catch (error) {
    return failure("SETTINGS_LOAD_FAILED", "Settings could not be loaded", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function saveSettings(input, storageArea = chrome.storage.local) {
  const validated = validateSettings(input);
  if (!validated.ok) {
    return validated;
  }

  try {
    await storageArea.set({ [STORAGE_KEYS.SETTINGS]: validated.value });
    return success(validated.value);
  } catch (error) {
    return failure("SETTINGS_SAVE_FAILED", "Settings could not be saved", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
