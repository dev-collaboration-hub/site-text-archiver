export async function publishProgressEvent(event) {
  if (!event || typeof event !== "object") return;
  try {
    await chrome.runtime.sendMessage(event);
  } catch {
    // No popup or dashboard listener is currently open.
  }
}
