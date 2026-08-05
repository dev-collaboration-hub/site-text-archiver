import { assertDeepEqual, assertEqual, assertResultError, assertResultOk, assertTrue } from "../assertions.js";
import { describe, run, test } from "../test-runner.js";
import { createId } from "../../src/shared/id.js";
import { failure, success } from "../../src/shared/result.js";
import { normalizeSettings, validateSettings } from "../../src/storage/settings-store.js";
import { MESSAGE_TYPES } from "../../src/messaging/message-types.js";
import { createMessage, validateMessage } from "../../src/messaging/message-validator.js";

const fakeCrypto = {
  getRandomValues(array) {
    array[0] = 1;
    array[1] = 2;
    return array;
  }
};

describe("Result contract", () => {
  test("success returns the shared shape", () => {
    const result = success({ value: 1 });
    assertResultOk(result);
    assertEqual(result.value.value, 1);
    assertEqual(result.error, null);
  });

  test("failure returns structured error", () => {
    const result = failure("TEST_ERROR", "Expected failure");
    assertResultError(result, "TEST_ERROR");
    assertEqual(result.error.message, "Expected failure");
  });
});

describe("Identifier helper", () => {
  test("creates deterministic test ID with injected inputs", () => {
    assertEqual(createId("req", 1000, fakeCrypto), "req_rs_00000010000002");
  });

  test("rejects invalid prefixes", () => {
    let threw = false;
    try { createId("Bad Prefix", 1000, fakeCrypto); } catch { threw = true; }
    assertTrue(threw);
  });
});

describe("Settings", () => {
  test("normalizes numeric limits and path", () => {
    const settings = normalizeSettings({
      maxPages: 20000,
      maxDepth: -1,
      allowedPathPrefix: "docs/",
      excludePatterns: ["  /blog ", "", "/blog"]
    });
    assertEqual(settings.maxPages, 10000);
    assertEqual(settings.maxDepth, 0);
    assertEqual(settings.allowedPathPrefix, "/docs");
    assertDeepEqual(settings.excludePatterns, ["/blog"]);
  });

  test("validates HTTP start URL and derives origin", () => {
    const result = validateSettings({ startUrl: "https://example.test/docs/" });
    assertResultOk(result);
    assertEqual(result.value.allowedOrigin, "https://example.test");
  });

  test("rejects unsupported start URL", () => {
    assertResultError(validateSettings({ startUrl: "file:///tmp/docs" }), "UNSUPPORTED_START_URL");
  });
});

describe("Message contract", () => {
  test("accepts a valid message", () => {
    const message = createMessage(MESSAGE_TYPES.PING, "req_1", {}, 10);
    assertResultOk(validateMessage(message));
  });

  test("rejects an unknown type", () => {
    const message = createMessage("UNKNOWN", "req_1", {}, 10);
    assertResultError(validateMessage(message), "UNKNOWN_MESSAGE_TYPE");
  });

  test("requires settings payload for save", () => {
    const message = createMessage(MESSAGE_TYPES.SAVE_SETTINGS, "req_1", {}, 10);
    assertResultError(validateMessage(message), "INVALID_PAYLOAD");
  });
});

void run();
