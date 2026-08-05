import { PROTOCOL_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { MESSAGE_TYPES, MESSAGE_TYPE_SET } from "./message-types.js";

export function createMessage(type, requestId, payload = {}, timestamp = Date.now()) {
  return {
    type,
    requestId,
    payload,
    timestamp,
    protocolVersion: PROTOCOL_VERSION
  };
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

  if (message.type === MESSAGE_TYPES.SAVE_SETTINGS && !message.payload.settings) {
    return failure("INVALID_PAYLOAD", "SAVE_SETTINGS requires payload.settings");
  }

  return success({ ...message, payload: { ...message.payload } });
}
