import { MESSAGE_TYPES } from "../src/messaging/message-types.js";
import { sendRuntimeMessage } from "../src/messaging/runtime-client.js";

const milestone = document.querySelector("#milestone");
const runtimeState = document.querySelector("#runtime-state");
const version = document.querySelector("#version");
const settingsList = document.querySelector("#settings-list");
const status = document.querySelector("#status");
const refreshButton = document.querySelector("#refresh-button");

function renderSettings(settings) {
  settingsList.replaceChildren();
  const entries = [
    ["Start URL", settings.startUrl || "Not set"],
    ["Allowed origin", settings.allowedOrigin || "Not set"],
    ["Allowed path", settings.allowedPathPrefix],
    ["Max pages", settings.maxPages],
    ["Max depth", settings.maxDepth],
    ["Request delay", `${settings.requestDelayMs} ms`],
    ["Retry limit", settings.retryLimit]
  ];

  for (const [label, value] of entries) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = String(value);
    settingsList.append(term, description);
  }
}

async function refresh() {
  status.textContent = "Loading…";
  const [statusResult, settingsResult] = await Promise.all([
    sendRuntimeMessage(MESSAGE_TYPES.GET_STATUS),
    sendRuntimeMessage(MESSAGE_TYPES.GET_SETTINGS)
  ]);

  if (!statusResult.ok) {
    status.textContent = statusResult.error.message;
    return;
  }

  milestone.textContent = statusResult.value.milestone;
  runtimeState.textContent = statusResult.value.state;
  version.textContent = statusResult.value.version;

  if (settingsResult.ok) renderSettings(settingsResult.value);
  status.textContent = "Foundation connected.";
}

refreshButton.addEventListener("click", () => void refresh());
void refresh();
