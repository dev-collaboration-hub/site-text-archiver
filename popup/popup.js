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
  excludePatterns: document.querySelector("#exclude-patterns"),
  status: document.querySelector("#status"),
  dashboardButton: document.querySelector("#dashboard-button")
};

function setStatus(message, kind = "") {
  elements.status.textContent = message;
  elements.status.className = `status ${kind}`.trim();
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
    excludePatterns: elements.excludePatterns.value.split("\n")
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
  elements.excludePatterns.value = (settings.excludePatterns ?? []).join("\n");
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
      elements.allowedPathPrefix.value = parts.length > 1 ? `/${parts.slice(0, -1).join("/")}` : "/";
    }
  } catch {
    // Unsupported active-tab URL; keep saved values.
  }
}

async function initialize() {
  const [ping, settingsResult] = await Promise.all([
    sendRuntimeMessage(MESSAGE_TYPES.PING),
    sendRuntimeMessage(MESSAGE_TYPES.GET_SETTINGS)
  ]);

  if (!ping.ok) {
    setStatus(ping.error.message, "error");
    return;
  }

  if (settingsResult.ok) fillForm(settingsResult.value);
  await detectActiveTab();
  setStatus(`Ready — ${ping.value.version}`, "success");
}

elements.form.addEventListener("submit", async event => {
  event.preventDefault();
  setStatus("Saving…");
  const result = await sendRuntimeMessage(MESSAGE_TYPES.SAVE_SETTINGS, { settings: readForm() });
  setStatus(result.ok ? "Setup saved locally." : result.error.message, result.ok ? "success" : "error");
  if (result.ok) fillForm(result.value);
});

elements.dashboardButton.addEventListener("click", async () => {
  const result = await sendRuntimeMessage(MESSAGE_TYPES.OPEN_DASHBOARD);
  if (!result.ok) setStatus(result.error.message, "error");
});

void initialize();
