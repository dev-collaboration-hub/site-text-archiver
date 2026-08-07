import { SCHEMA_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";

export function createFetchRecord(input = {}) {
  for (const field of ["taskId", "requestedUrl", "finalUrl", "contentType"]) {
    if (typeof input[field] !== "string" || input[field].length === 0) {
      return failure("INVALID_FETCH_RECORD", `${field} is required`, false, { field });
    }
  }
  for (const field of ["status", "htmlByteLength", "fetchedAt", "durationMs"]) {
    if (!Number.isFinite(input[field]) || input[field] < 0) {
      return failure("INVALID_FETCH_RECORD", `${field} must be non-negative`, false, { field });
    }
  }
  return success({
    schemaVersion: SCHEMA_VERSION,
    taskId: input.taskId,
    requestedUrl: input.requestedUrl,
    finalUrl: input.finalUrl,
    status: input.status,
    contentType: input.contentType,
    htmlByteLength: input.htmlByteLength,
    redirected: Boolean(input.redirected),
    canonicalUrl: input.canonicalUrl ?? null,
    discoveredLinkCount: Number.isInteger(input.discoveredLinkCount) ? input.discoveredLinkCount : 0,
    acceptedLinkCount: Number.isInteger(input.acceptedLinkCount) ? input.acceptedLinkCount : 0,
    rejectedLinkCount: Number.isInteger(input.rejectedLinkCount) ? input.rejectedLinkCount : 0,
    fetchedAt: input.fetchedAt,
    durationMs: input.durationMs
  });
}
