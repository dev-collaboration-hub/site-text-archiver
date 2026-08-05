export function success(value = null, warnings = []) {
  return Object.freeze({
    ok: true,
    value,
    warnings: Array.isArray(warnings) ? [...warnings] : [],
    error: null
  });
}

export function failure(code, message, recoverable = false, details = {}) {
  if (typeof code !== "string" || code.length === 0) {
    throw new TypeError("failure code must be a non-empty string");
  }

  if (typeof message !== "string" || message.length === 0) {
    throw new TypeError("failure message must be a non-empty string");
  }

  return Object.freeze({
    ok: false,
    value: null,
    warnings: [],
    error: Object.freeze({
      code,
      message,
      recoverable: Boolean(recoverable),
      details: details && typeof details === "object" ? { ...details } : {}
    })
  });
}
