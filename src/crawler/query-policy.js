import { failure, success } from "../shared/result.js";

export const DEFAULT_REMOVABLE_QUERY_PARAMETERS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid"
]);

export function normalizeQueryPolicy(input = {}) {
  const value = input && typeof input === "object" ? input : {};
  const removable = Array.isArray(value.removableParameters)
    ? value.removableParameters
        .filter(item => typeof item === "string")
        .map(item => item.trim().toLowerCase())
        .filter(Boolean)
    : DEFAULT_REMOVABLE_QUERY_PARAMETERS;
  const retained = Array.isArray(value.retainedParameters)
    ? value.retainedParameters
        .filter(item => typeof item === "string")
        .map(item => item.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return Object.freeze({
    removableParameters: Object.freeze([...new Set(removable)]),
    retainedParameters: Object.freeze([...new Set(retained)]),
    removeEmptyParameters: value.removeEmptyParameters !== false
  });
}

export function applyQueryPolicy(urlInput, policyInput = {}) {
  let url;
  try {
    url = urlInput instanceof URL ? new URL(urlInput.href) : new URL(String(urlInput));
  } catch {
    return failure("INVALID_URL", "Query policy requires a valid absolute URL");
  }

  const policy = normalizeQueryPolicy(policyInput);
  const removable = new Set(policy.removableParameters);
  const retained = new Set(policy.retainedParameters);
  const removedParameters = [];
  const entries = [];

  for (const [name, value] of url.searchParams.entries()) {
    const normalizedName = name.toLowerCase();
    if (
      !retained.has(normalizedName) &&
      (removable.has(normalizedName) || (policy.removeEmptyParameters && value === ""))
    ) {
      removedParameters.push(name);
      continue;
    }
    entries.push([name, value]);
  }

  entries.sort(
    ([aName, aValue], [bName, bValue]) =>
      aName.localeCompare(bName) || aValue.localeCompare(bValue)
  );

  url.search = "";
  for (const [name, value] of entries) {
    url.searchParams.append(name, value);
  }

  return success({ url, removedParameters });
}
