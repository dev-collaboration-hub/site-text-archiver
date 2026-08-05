import { APP_NAME, APP_VERSION, CRAWL_STATES } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { loadSettings, saveSettings } from "../storage/settings-store.js";
import { MESSAGE_TYPES } from "../messaging/message-types.js";
import { validateMessage } from "../messaging/message-validator.js";

async function handleMessage(message) {
  switch (message.type) {
    case MESSAGE_TYPES.PING:
      return success({ appName: APP_NAME, version: APP_VERSION, alive: true });

    case MESSAGE_TYPES.GET_STATUS:
      return success({ state: CRAWL_STATES.IDLE, milestone: "M0", version: APP_VERSION });

    case MESSAGE_TYPES.GET_SETTINGS:
      return loadSettings();

    case MESSAGE_TYPES.SAVE_SETTINGS:
      return saveSettings(message.payload.settings);

    case MESSAGE_TYPES.OPEN_DASHBOARD:
      await chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
      return success({ opened: true });

    default:
      return failure("HANDLER_NOT_FOUND", "No handler exists for this message type");
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void loadSettings().then(result => {
    if (!result.ok) {
      console.warn("Site Text Archiver settings initialization failed", result.error);
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const validated = validateMessage(message);
  if (!validated.ok) {
    sendResponse(validated);
    return false;
  }

  void handleMessage(validated.value)
    .then(sendResponse)
    .catch(error => {
      sendResponse(
        failure("HANDLER_FAILED", "Runtime handler failed", true, {
          message: error instanceof Error ? error.message : String(error)
        })
      );
    });

  return true;
});
