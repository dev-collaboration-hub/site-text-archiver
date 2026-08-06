import { failure, success } from "../shared/result.js";

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
  }
  return value;
}

export function fingerprintPayload(payload) {
  return JSON.stringify(stableValue(payload ?? {}));
}

export function findCachedRequest(cache, requestId, messageType, payload) {
  const item = (Array.isArray(cache) ? cache : []).find(entry => entry.requestId === requestId);
  if (!item) return success(null);
  const fingerprint = fingerprintPayload(payload);
  if (item.messageType !== messageType || item.payloadFingerprint !== fingerprint) {
    return failure("REQUEST_ID_REUSED", "requestId was reused with different content", false, { requestId });
  }
  return success(item.response);
}

export function rememberRequest(cache, requestId, messageType, payload, response, now = Date.now(), maximum = 100) {
  const entries = (Array.isArray(cache) ? cache : []).filter(entry => entry.requestId !== requestId);
  entries.push({
    requestId,
    messageType,
    payloadFingerprint: fingerprintPayload(payload),
    response,
    createdAt: now
  });
  return entries.slice(-maximum);
}
