import { APP_NAME, APP_VERSION } from "../shared/constants.js";
import { failure, success } from "../shared/result.js";
import { loadSettings, saveSettings } from "../storage/settings-store.js";
import { MESSAGE_TYPES } from "../messaging/message-types.js";
import { validateMessage } from "../messaging/message-validator.js";
import { publishProgressEvent } from "../messaging/event-publisher.js";
import { clearCrawlTick, CRAWL_TICK_ALARM, scheduleCrawlTick } from "./alarm-adapter.js";
import { createRuntimeController } from "./runtime-controller.js";

const runtimeController = createRuntimeController({
  storageArea: chrome.storage.local,
  publishEvent: publishProgressEvent
});

let serialChain = Promise.resolve();

function serial(operation) {
  const result = serialChain.then(operation, operation);
  serialChain = result.then(() => undefined, () => undefined);
  return result;
}

async function processCrawlerTick() {
  const processed = await runtimeController.processNextTask();
  if (!processed.ok) {
    console.warn("Site Text Archiver M3 crawl tick failed", processed.error);
    return processed;
  }
  if (processed.value.shouldContinue) {
    await scheduleCrawlTick(processed.value.nextDelayMs ?? 0);
  } else {
    await clearCrawlTick();
  }
  return processed;
}

async function handleMessage(message) {
  switch (message.type) {
    case MESSAGE_TYPES.PING:
      return success({ appName: APP_NAME, version: APP_VERSION, alive: true });

    case MESSAGE_TYPES.GET_STATUS: {
      const summary = await runtimeController.getSummary();
      if (!summary.ok) return summary;
      return success({
        state: summary.value.lifecycle,
        milestone: "M3",
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

    case MESSAGE_TYPES.CRAWL_START: {
      const result = await runtimeController.startCrawl(message);
      if (result.ok) await scheduleCrawlTick(0);
      return result;
    }

    case MESSAGE_TYPES.CRAWL_PAUSE: {
      const result = await runtimeController.pauseCrawl(message);
      if (result.ok) await clearCrawlTick();
      return result;
    }

    case MESSAGE_TYPES.CRAWL_RESUME: {
      const result = await runtimeController.resumeCrawl(message);
      if (result.ok) await scheduleCrawlTick(0);
      return result;
    }

    case MESSAGE_TYPES.CRAWL_CANCEL: {
      const result = await runtimeController.cancelCrawl(message);
      if (result.ok) await clearCrawlTick();
      return result;
    }

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

void serial(async () => {
  const restored = await runtimeController.restoreActiveCrawl();
  if (!restored.ok) {
    console.warn("Site Text Archiver crawl restoration failed", restored.error);
    return;
  }
  if (restored.value?.run?.lifecycle === "RUNNING") {
    await scheduleCrawlTick(0);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void loadSettings().then(result => {
    if (!result.ok) console.warn("Site Text Archiver settings initialization failed", result.error);
  });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== CRAWL_TICK_ALARM) return;
  void serial(processCrawlerTick);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const validated = validateMessage(message);
  if (!validated.ok) {
    sendResponse(validated);
    return false;
  }

  void serial(() => handleMessage(validated.value))
    .then(sendResponse)
    .catch(error => {
      sendResponse(failure("HANDLER_FAILED", "Runtime handler failed", true, {
        message: error instanceof Error ? error.message : String(error)
      }));
    });

  return true;
});
