import { success } from "../shared/result.js";
import { resolveUrl } from "./url-resolver.js";
import { normalizeUrl } from "./url-normalizer.js";
import { evaluateUrlScope } from "./scope-guard.js";

export function inspectUrl(rawUrl, parentUrl, config = {}, context = {}) {
  const resolved = resolveUrl(rawUrl, parentUrl);
  if (!resolved.ok) {
    return resolved;
  }

  const normalized = normalizeUrl(
    resolved.value.resolvedUrl,
    config.queryPolicy ?? {}
  );
  if (!normalized.ok) {
    return normalized;
  }

  const scope = evaluateUrlScope(
    normalized.value.normalizedUrl,
    config,
    {
      ...context,
      canonicalKey: normalized.value.canonicalKey
    }
  );

  return success({
    ...normalized.value,
    originalUrl: rawUrl,
    resolvedUrl: resolved.value.resolvedUrl,
    scope
  });
}
