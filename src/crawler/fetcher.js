import { failure, success } from "../shared/result.js";
import { classifyHttpResponse } from "./response-classifier.js";

function headerValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  const key = Object.keys(headers).find(key => key.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : null;
}

export async function fetchHtmlPage(input = {}, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl ?? globalThis.fetch;
  const now = typeof dependencies.now === "function" ? dependencies.now : () => Date.now();
  const AbortControllerImpl = dependencies.AbortControllerImpl ?? globalThis.AbortController;
  const externalSignal = typeof dependencies.externalSignalProvider === "function"
    ? dependencies.externalSignalProvider()
    : dependencies.signal ?? input.signal ?? null;
  if (typeof fetchImpl !== "function" || typeof AbortControllerImpl !== "function") {
    return failure("FETCH_RUNTIME_UNAVAILABLE", "Fetch runtime is unavailable");
  }
  const timeoutMs = Number.isInteger(input.timeoutMs) ? input.timeoutMs : 15000;
  const maxHtmlBytes = Number.isInteger(input.maxHtmlBytes) ? input.maxHtmlBytes : 5_000_000;
  const startedAt = now();
  const controller = new AbortControllerImpl();
  let externallyAborted = Boolean(externalSignal?.aborted);
  const abortFromExternal = () => {
    externallyAborted = true;
    controller.abort();
  };
  if (externalSignal?.addEventListener) externalSignal.addEventListener("abort", abortFromExternal, { once: true });
  if (externallyAborted) controller.abort();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(input.url, {
      method: "GET",
      redirect: "follow",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "text/html,application/xhtml+xml;q=0.9" }
    });
    const contentType = headerValue(response.headers, "content-type") ?? "";
    const contentLengthHeader = headerValue(response.headers, "content-length");
    const contentLength = contentLengthHeader == null ? NaN : Number(contentLengthHeader);
    const classified = classifyHttpResponse({
      status: response.status,
      contentType,
      contentLength,
      maxHtmlBytes,
      retryAfter: headerValue(response.headers, "retry-after"),
      now: now()
    });
    if (!classified.ok) return classified;
    if (classified.value.disposition !== "ACCEPT") {
      return failure(classified.value.reasonCode, "HTTP response was not accepted as crawlable HTML", classified.value.recoverable, {
        disposition: classified.value.disposition,
        status: response.status,
        finalUrl: response.url || input.url,
        contentType,
        retryAfterMs: classified.value.retryAfterMs
      });
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxHtmlBytes) {
      return failure("HTML_SIZE_LIMIT", "HTML response exceeded the configured byte limit", false, {
        disposition: "SKIP",
        htmlByteLength: buffer.byteLength,
        maxHtmlBytes
      });
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const finishedAt = now();
    return success({
      requestedUrl: input.url,
      finalUrl: response.url || input.url,
      status: response.status,
      contentType,
      htmlByteLength: buffer.byteLength,
      redirected: Boolean(response.redirected),
      html,
      fetchedAt: finishedAt,
      durationMs: Math.max(0, finishedAt - startedAt)
    });
  } catch (error) {
    const timedOut = controller.signal.aborted && !externallyAborted;
    const code = externallyAborted ? "FETCH_CANCELLED" : timedOut ? "FETCH_TIMEOUT" : "NETWORK_ERROR";
    return failure(
      code,
      externallyAborted ? "Page fetch was cancelled" : timedOut ? "Page fetch timed out" : "Page fetch failed",
      true,
      {
        disposition: "RETRY",
        message: error instanceof Error ? error.message : String(error)
      }
    );
  } finally {
    clearTimeout(timer);
    if (externalSignal?.removeEventListener) externalSignal.removeEventListener("abort", abortFromExternal);
  }
}
