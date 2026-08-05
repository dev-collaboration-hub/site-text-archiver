import { createId } from "../shared/id.js";
import { failure } from "../shared/result.js";
import { createMessage } from "./message-validator.js";

export function sendRuntimeMessage(type, payload = {}) {
  const message = createMessage(type, createId("req"), payload);

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, response => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        resolve(failure("RUNTIME_MESSAGE_FAILED", runtimeError.message, true));
        return;
      }
      resolve(response ?? failure("EMPTY_RUNTIME_RESPONSE", "Runtime returned no response", true));
    });
  });
}
