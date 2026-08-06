import { MESSAGE_TYPES } from "../src/messaging/message-types.js";
import { sendRuntimeMessage } from "../src/messaging/runtime-client.js";

const elements = {
  form: document.querySelector("#settings-form"),
  startUrl: document.querySelector("#start-url"),
  allowedOrigin: document.querySelector("#allowed-origin"),
  allowedPathPrefix: document.querySelector("#allowed-path"),
  maxPages: document.querySelector("#max-pages"),
  maxDepth: document.querySelector("#max-depth"),
  requestDelayMs: document.querySelector("#request-delay"),
  retryLimit: document.querySelector("#retry-limit"),
  includePatterns: document.querySelector("#include-patterns"),
  excludePatterns: document.querySelector("#exclude-patterns"),
  crawlSummary: document.querySelector("#crawl-summary"),
  createButton: document.querySelector("#create-button"),
  startButton: document.querySelector("#start-button"),
  pauseButton: document.querySelector("#pause-button"),
  resumeButton: document.querySelector("#resume-button"),
  cancelButton: document.querySelector("#cancel-button"),
  status: document.querySelector("#status"),
  dashboardButton: document.querySelector("#dashboard-button")
};

const TERMINAL_STATES = new Set(["COMPLETED", "CANCELLED", "FAILED"]);
let activeCrawlId = null;

function setStatus(message, kind = "") {
  elements.status.textContent = message;
  elements.status.className = `status ${kind}`.trim();
}

function readPatternLines(element) {
  return element.value.split("\n");
}

function readForm() {
  return {
    startUrl: elements.startUrl.value,
    allowedOrigin: elements.allowedOrigin.value,
    allowedPathPrefix: elements.allowedPathPrefix.value,
    maxPages: Number(elements.maxPages.value),
    maxDepth: Number(elements.maxDepth.value),
    requestDelayMs: Number(elements.requestDelayMs.value),
    retryLimit: Number(elements.retryLimit.value),
    includePatterns: readPatternLines(elements.includePatterns),
    excludePatterns: readPatternLines(elements.excludePatterns)
  };
}

function fillForm(settings) {
  elements.startUrl.value = settings.startUrl ?? "";
  elements.allowedOrigin.value = settings.allowedOrigin ?? "";
  elements.allowedPathPrefix.value = settings.allowedPathPrefix ?? "/";
  elements.maxPages.value = settings.maxPages ?? 100;
  elements.maxDepth.value = settings.maxDepth ?? 5;
  elements.requestDelayMs.value = settings.requestDelayMs ?? 500;
  elements.retryLimit.value = settings.retryLimit ?? 2;
  elements.includePatterns.value = (settings.includePatterns ?? []).join("\n");
  elements.excludePatterns.value = (settings.excludePatterns ?? []).join("\n");
}

function renderCrawl(summary) {
  activeCrawlId = summary?.crawlId ?? null;
  const lifecycle = summary?.lifecycle ?? "IDLE";
  const counts = summary?.counts ?? {};
  elements.crawlSummary.textContent = activeCrawlId
    ? `${lifecycle} · queued ${counts.queued ?? 0} · completed ${counts.completed ?? 0} · ${activeCrawlId}`
    : "No active crawl.";

  const hasActive = Boolean(activeCrawlId);
  const terminal = TERMINAL_STATES.has(lifecycle);
  elements.createButton.disabled = hasActive && !terminal;
  elements.startButton.disabled = lifecycle !== "READY";
  elements.pauseButton.disabled = lifecycle !== "RUNNING";
  elements.resumeButton.disabled = lifecycle !== "PAUSED";
  elements.cancelButton.disabled = !hasActive || terminal;
}

async function detectActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  try {
    const url = new URL(tab.url);
    if (!["http:", "https:"].includes(url.protocol)) return;
    if (!elements.startUrl.value) elements.startUrl.value = url.href;
    if (!elements.allowedOrigin.value) elements.allowedOrigin.value = url.origin;
    if (elements.allowedPathPrefix.value === "/") {
      const parts = url.pathname.split("/").filter(Boolean);
      elements.allowedPathPrefix.value = parts.length > 1
        ? `/${parts.slice(0, -1).join("/")}`
        : "/";
    }
  } catch {
    // Keep saved values for unsupported active-tab URLs.
  }
}

async function refreshCrawl() {
  const result = await sendRuntimeMessage(MESSAGE_TYPES.GET_STATUS);
  if (!result.ok) {
    setStatus(result.error.message, "error");
    return result;
  }
  renderCrawl(result.value.activeCrawl);
  return result;
}

async function saveSetup() {
  const result = await sendRuntimeMessage(MESSAGE_TYPES.SAVE_SETTINGS, {
    settings: readForm()
  });
  if (result.ok) fillForm(result.value);
  return result;
}

async function runControl(type, successMessage) {
  if (!activeCrawlId) return;
  setStatus("Updating crawl…");
  const result = await sendRuntimeMessage(type, { crawlId: activeCrawlId });
  if (!result.ok) {
    setStatus(result.error.message, "error");
    return;
  }
  await refreshCrawl();
  setStatus(successMessage, "success");
}

async function initialize() {
  const [ping, settingsResult, statusResult] = await Promise.all([
    sendRuntimeMessage(MESSAGE_TYPES.PING),
    sendRuntimeMessage(MESSAGE_TYPES.GET_SETTINGS),
    sendRuntimeMessage(MESSAGE_TYPES.GET_STATUS)
  ]);
  if (!ping.ok) {
    setStatus(ping.error.message, "error");
    return;
  }
  if (settingsResult.ok) fillForm(settingsResult.value);
  if (statusResult.ok) renderCrawl(statusResult.value.activeCrawl);
  await detectActiveTab();
  setStatus(`Ready — ${ping.value.version}`, "success");
}

elements.form.addEventListener("submit", async event => {
  event.preventDefault();
  setStatus("Saving…");
  const result = await saveSetup();
  setStatus(
    result.ok ? "Setup saved locally." : result.error.message,
    result.ok ? "success" : "error"
  );
});

elements.createButton.addEventListener("click", async () => {
  setStatus("Creating crawl…");
  const saved = await saveSetup();
  if (!saved.ok) {
    setStatus(saved.error.message, "error");
    return;
  }
  const created = await sendRuntimeMessage(MESSAGE_TYPES.CRAWL_CREATE, {
    config: saved.value
  });
  if (!created.ok) {
    setStatus(created.error.message, "error");
    return;
  }
  activeCrawlId = created.value.crawlId;
  await refreshCrawl();
  setStatus("Crawl queue created and persisted.", "success");
});

elements.startButton.addEventListener("click", () => {
  void runControl(MESSAGE_TYPES.CRAWL_START, "Crawl started.");
});
elements.pauseButton.addEventListener("click", () => {
  void runControl(MESSAGE_TYPES.CRAWL_PAUSE, "Crawl paused safely.");
});
elements.resumeButton.addEventListener("click", () => {
  void runControl(MESSAGE_TYPES.CRAWL_RESUME, "Crawl resumed.");
});
elements.cancelButton.addEventListener("click", () => {
  void runControl(MESSAGE_TYPES.CRAWL_CANCEL, "Crawl cancelled.");
});

elements.dashboardButton.addEventListener("click", async () => {
  const result = await sendRuntimeMessage(MESSAGE_TYPES.OPEN_DASHBOARD);
  if (!result.ok) setStatus(result.error.message, "error");
});

chrome.runtime.onMessage.addListener(event => {
  if (event?.crawlId && (!activeCrawlId || event.crawlId === activeCrawlId)) {
    void refreshCrawl();
  }
});

void initialize();
