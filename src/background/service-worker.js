import { APP_NAME, APP_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { loadSettings, saveSettings } from "../storage/settings-store.js";
import { MESSAGE_TYPES } from "../messaging/message-types.js";
import { validateMessage } from "../messaging/message-validator.js";
import { publishProgressEvent } from "../messaging/event-publisher.js";
import { createRuntimeController } from "./runtime-controller.js";

const runtimeController = createRuntimeController({
  storageArea: chrome.storage.local,
  publishEvent: publishProgressEvent
});

async function handleMessage(message) {
  switch (message.type) {
    case MESSAGE_TYPES.PING:
      return success({ appName: APP_NAME, version: APP_VERSION, alive: true });

    case MESSAGE_TYPES.GET_STATUS: {
      const summary = await runtimeController.getSummary();
      if (!summary.ok) return summary;
      return success({
        state: summary.value.lifecycle,
        milestone: "M2",
        version: APP_VERSION,
        activeCrawl: summary.value.crawlId ? summary.value : null
      });
    }

    case MESSAGE_TYPES.GET_SETTINGS:
      return loadSettings();

    case MESSAGE_TYPES.SAVE_SETTINGS:
      return saveSettings(message.payload.settings);

    case MESSAGE_TYPES.CRAWL_CREATE:
      return runtimeController.createCrawl(message);

    case MESSAGE_TYPES.CRAWL_START:
      return runtimeController.startCrawl(message);

    case MESSAGE_TYPES.CRAWL_PAUSE:
      return runtimeController.pauseCrawl(message);

    case MESSAGE_TYPES.CRAWL_RESUME:
      return runtimeController.resumeCrawl(message);

    case MESSAGE_TYPES.CRAWL_CANCEL:
      return runtimeController.cancelCrawl(message);

    case MESSAGE_TYPES.GET_CRAWL_SUMMARY:
      return runtimeController.getSummary(message.payload.crawlId);

    case MESSAGE_TYPES.GET_AGENT_EVENTS:
      return runtimeController.getEvents(
        message.payload.crawlId,
        message.payload.offset,
        message.payload.limit
      );

    case MESSAGE_TYPES.OPEN_DASHBOARD:
      await chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
      return success({ opened: true });

    default:
      return failure("HANDLER_NOT_FOUND", "No handler exists for this message type");
  }
}

void runtimeController.restoreActiveCrawl().then(result => {
  if (!result.ok) console.warn("Site Text Archiver crawl restoration failed", result.error);
});

chrome.runtime.onInstalled.addListener(() => {
  void loadSettings().then(result => {
    if (!result.ok) console.warn("Site Text Archiver settings initialization failed", result.error);
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
      sendResponse(failure("HANDLER_FAILED", "Runtime handler failed", true, {
        message: error instanceof Error ? error.message : String(error)
      }));
    });

  return true;
});
