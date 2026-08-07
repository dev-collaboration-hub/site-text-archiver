import { PROTOCOL_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { MESSAGE_TYPES, MESSAGE_TYPE_SET } from "./message-types.js";

const CRAWL_TARGET_MESSAGES = new Set([
  MESSAGE_TYPES.CRAWL_START,
  MESSAGE_TYPES.CRAWL_PAUSE,
  MESSAGE_TYPES.CRAWL_RESUME,
  MESSAGE_TYPES.CRAWL_CANCEL,
  MESSAGE_TYPES.GET_CRAWL_SUMMARY,
  MESSAGE_TYPES.GET_AGENT_EVENTS,
  MESSAGE_TYPES.EXPORT_ARCHIVE
]);

export function createMessage(type, requestId, payload = {}, timestamp = Date.now()) {
  return { type, requestId, payload, timestamp, protocolVersion: PROTOCOL_VERSION };
}

export function validateMessage(message) {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return failure("INVALID_MESSAGE", "Message must be an object");
  }
  if (!MESSAGE_TYPE_SET.has(message.type)) {
    return failure("UNKNOWN_MESSAGE_TYPE", "Message type is not supported");
  }
  if (typeof message.requestId !== "string" || message.requestId.length === 0) {
    return failure("MISSING_REQUEST_ID", "Message requestId is required");
  }
  if (message.protocolVersion !== PROTOCOL_VERSION) {
    return failure("INVALID_MESSAGE_VERSION", "Message protocol version is not supported");
  }
  if (!Number.isSafeInteger(message.timestamp) || message.timestamp < 0) {
    return failure("INVALID_MESSAGE_TIMESTAMP", "Message timestamp is invalid");
  }
  if (!message.payload || typeof message.payload !== "object" || Array.isArray(message.payload)) {
    return failure("INVALID_PAYLOAD", "Message payload must be an object");
  }
  if (message.type === MESSAGE_TYPES.SAVE_SETTINGS && (!message.payload.settings || typeof message.payload.settings !== "object")) {
    return failure("INVALID_PAYLOAD", "SAVE_SETTINGS requires payload.settings");
  }
  if (message.type === MESSAGE_TYPES.CRAWL_CREATE && (!message.payload.config || typeof message.payload.config !== "object")) {
    return failure("INVALID_PAYLOAD", "CRAWL_CREATE requires payload.config");
  }
  if (CRAWL_TARGET_MESSAGES.has(message.type) && (typeof message.payload.crawlId !== "string" || message.payload.crawlId.length === 0)) {
    return failure("INVALID_PAYLOAD", `${message.type} requires payload.crawlId`);
  }
  if (message.type === MESSAGE_TYPES.GET_AGENT_EVENTS) {
    for (const field of ["offset", "limit"]) {
      if (message.payload[field] !== undefined && (!Number.isInteger(message.payload[field]) || message.payload[field] < 0)) {
        return failure("INVALID_PAYLOAD", `${field} must be a non-negative integer`);
      }
    }
  }
  if (message.type === MESSAGE_TYPES.EXPORT_ARCHIVE && message.payload.includeEmptyFailureReport !== undefined && typeof message.payload.includeEmptyFailureReport !== "boolean") {
    return failure("INVALID_PAYLOAD", "includeEmptyFailureReport must be boolean");
  }
  return success({ ...message, payload: { ...message.payload } });
}
