import { failure, success } from "../shared/result.js";

const VALID_STATES = new Set([
  "QUEUED",
  "VISITED",
  "SKIPPED",
  "COMPLETED"
]);

export function createDuplicateUrlRegistry(initialSnapshot = []) {
  const entries = new Map();

  for (const item of Array.isArray(initialSnapshot) ? initialSnapshot : []) {
    if (
      item &&
      typeof item.canonicalKey === "string" &&
      VALID_STATES.has(item.state)
    ) {
      entries.set(item.canonicalKey, item.state);
    }
  }

  return Object.freeze({
    register(canonicalKey, state = "QUEUED") {
      if (typeof canonicalKey !== "string" || canonicalKey.length === 0) {
        return failure(
          "INVALID_CANONICAL_KEY",
          "Canonical key must be a non-empty string"
        );
      }

      if (!VALID_STATES.has(state)) {
        return failure(
          "INVALID_DUPLICATE_STATE",
          "Duplicate registry state is invalid",
          false,
          { state }
        );
      }

      if (entries.has(canonicalKey)) {
        return failure(
          "DUPLICATE_URL",
          "Canonical URL is already registered",
          false,
          {
            canonicalKey,
            existingState: entries.get(canonicalKey)
          }
        );
      }

      entries.set(canonicalKey, state);
      return success({ canonicalKey, state });
    },

    has(canonicalKey) {
      return entries.has(canonicalKey);
    },

    getState(canonicalKey) {
      return entries.get(canonicalKey) ?? null;
    },

    update(canonicalKey, state) {
      if (!entries.has(canonicalKey)) {
        return failure(
          "URL_NOT_REGISTERED",
          "Canonical URL is not registered",
          false,
          { canonicalKey }
        );
      }

      if (!VALID_STATES.has(state)) {
        return failure(
          "INVALID_DUPLICATE_STATE",
          "Duplicate registry state is invalid",
          false,
          { state }
        );
      }

      entries.set(canonicalKey, state);
      return success({ canonicalKey, state });
    },

    snapshot() {
      return [...entries.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([canonicalKey, state]) => ({ canonicalKey, state }));
    },

    size() {
      return entries.size;
    }
  });
}
