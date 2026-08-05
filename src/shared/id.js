const PREFIX_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;

export function createId(prefix, now = Date.now(), cryptoObject = globalThis.crypto) {
  if (typeof prefix !== "string" || !PREFIX_PATTERN.test(prefix)) {
    throw new TypeError("prefix must match /^[a-z][a-z0-9_-]{0,31}$/");
  }

  if (!Number.isSafeInteger(now) || now < 0) {
    throw new TypeError("now must be a non-negative safe integer");
  }

  if (!cryptoObject || typeof cryptoObject.getRandomValues !== "function") {
    throw new TypeError("crypto.getRandomValues is required");
  }

  const random = new Uint32Array(2);
  cryptoObject.getRandomValues(random);
  const randomPart = Array.from(random, value => value.toString(36).padStart(7, "0")).join("");
  return `${prefix}_${now.toString(36)}_${randomPart}`;
}
