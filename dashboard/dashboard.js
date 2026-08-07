import { MESSAGE_TYPES } from "../src/messaging/message-types.js";
import { sendRuntimeMessage } from "../src/messaging/runtime-client.js";

const elements = {
  milestone: document.querySelector("#milestone"),
  runtimeState: document.querySelector("#runtime-state"),
  version: document.querySelector("#version"),
  queuedCount: document.querySelector("#queued-count"),
  fetchedCount: document.querySelector("#fetched-count"),
  extractedCount: document.querySelector("#extracted-count"),
  failedCount: document.querySelector("#failed-count"),
  crawlList: document.querySelector("#crawl-list"),
  pageList: document.querySelector("#page-list"),
  eventList: document.querySelector("#event-list"),
  settingsList: document.querySelector("#settings-list"),
  status: document.querySelector("#status"),
  refreshButton: document.querySelector("#refresh-button")
};

function renderDefinitionList(element, entries) {
  element.replaceChildren();
  for (const [label, value] of entries) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = String(value);
    element.append(term, description);
  }
}

function renderSettings(settings) {
  renderDefinitionList(elements.settingsList, [
    ["Start URL", settings.startUrl || "Not set"],
    ["Allowed origin", settings.allowedOrigin || "Not set"],
    ["Allowed path", settings.allowedPathPrefix],
    ["Max pages", settings.maxPages],
    ["Max depth", settings.maxDepth],
    ["Request delay", `${settings.requestDelayMs} ms`],
    ["Retry limit", settings.retryLimit]
  ]);
}

function renderPages(pages = []) {
  elements.pageList.replaceChildren();
  for (const page of pages) {
    const item = document.createElement("li");
    item.textContent = `${page.title} · ${page.blockCount} blocks · ${page.headingCount} headings · ${page.warningCount} warnings`;
    elements.pageList.append(item);
  }
  if (pages.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No pages extracted yet.";
    elements.pageList.append(item);
  }
}

function renderCrawl(summary) {
  const counts = summary?.counts ?? {};
  elements.queuedCount.textContent = String(counts.queued ?? 0);
  elements.fetchedCount.textContent = String(counts.fetched ?? 0);
  elements.extractedCount.textContent = String(counts.extracted ?? 0);
  elements.failedCount.textContent = String(counts.failed ?? 0);
  renderDefinitionList(elements.crawlList, summary ? [
    ["Crawl ID", summary.crawlId],
    ["Lifecycle", summary.lifecycle],
    ["State version", summary.stateVersion],
    ["Start URL", summary.startUrl],
    ["Discovered", counts.discovered ?? 0],
    ["Queued", counts.queued ?? 0],
    ["Fetching", counts.fetching ?? 0],
    ["Fetched", counts.fetched ?? 0],
    ["Extracting", counts.extracting ?? 0],
    ["Extracted", counts.extracted ?? 0],
    ["Skipped", counts.skipped ?? 0],
    ["Failed", counts.failed ?? 0]
  ] : [["Status", "No active crawl"]]);
  renderPages(summary?.pageSummaries ?? []);
}

function renderEvents(events) {
  elements.eventList.replaceChildren();
  for (const event of events) {
    const item = document.createElement("li");
    const detail = event.payload?.reasonCode
      ? ` · ${event.payload.reasonCode}`
      : event.payload?.title
        ? ` · ${event.payload.title}`
        : event.payload?.finalUrl
          ? ` · ${event.payload.finalUrl}`
          : "";
    item.textContent = `#${event.sequence} ${event.type} — ${event.payload.lifecycle}${detail}`;
    elements.eventList.append(item);
  }
  if (events.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No events recorded.";
    elements.eventList.append(item);
  }
}

async function refresh() {
  elements.status.textContent = "Loading…";
  const [statusResult, settingsResult] = await Promise.all([
    sendRuntimeMessage(MESSAGE_TYPES.GET_STATUS),
    sendRuntimeMessage(MESSAGE_TYPES.GET_SETTINGS)
  ]);
  if (!statusResult.ok) {
    elements.status.textContent = statusResult.error.message;
    return;
  }

  elements.milestone.textContent = statusResult.value.milestone;
  elements.runtimeState.textContent = statusResult.value.state;
  elements.version.textContent = statusResult.value.version;
  renderCrawl(statusResult.value.activeCrawl);
  if (settingsResult.ok) renderSettings(settingsResult.value);

  const crawlId = statusResult.value.activeCrawl?.crawlId;
  if (crawlId) {
    const eventsResult = await sendRuntimeMessage(MESSAGE_TYPES.GET_AGENT_EVENTS, {
      crawlId,
      offset: 0,
      limit: 50
    });
    renderEvents(eventsResult.ok ? eventsResult.value.items : []);
  } else {
    renderEvents([]);
  }
  elements.status.textContent = "M4 runtime connected.";
}

elements.refreshButton.addEventListener("click", () => void refresh());
chrome.runtime.onMessage.addListener(event => {
  if (event?.eventId) void refresh();
});
void refresh();
