import {
  assertDeepEqual,
  assertEqual,
  assertFalse,
  assertResultError,
  assertResultOk,
  assertTrue
} from "../assertions.js";
import { describe, run, test } from "../test-runner.js";
import { createId } from "../../src/shared/id.js";
import { failure, success } from "../../src/shared/result.js";
import {
  normalizeSettings,
  validateSettings
} from "../../src/storage/settings-store.js";
import { MESSAGE_TYPES } from "../../src/messaging/message-types.js";
import {
  createMessage,
  validateMessage
} from "../../src/messaging/message-validator.js";
import { resolveUrl } from "../../src/crawler/url-resolver.js";
import {
  createCanonicalKey,
  normalizeUrl
} from "../../src/crawler/url-normalizer.js";
import { applyQueryPolicy } from "../../src/crawler/query-policy.js";
import {
  getPathExtension,
  isBlockedExtension
} from "../../src/crawler/blocked-extensions.js";
import { inspectUnsafeAction } from "../../src/crawler/link-safety.js";
import { evaluateUrlScope } from "../../src/crawler/scope-guard.js";
import { createDuplicateUrlRegistry } from "../../src/crawler/duplicate-url-registry.js";
import { inspectUrl } from "../../src/crawler/url-intelligence.js";

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
    try {
      createId("Bad Prefix", 1000, fakeCrypto);
    } catch {
      threw = true;
    }
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
    assertResultError(
      validateSettings({ startUrl: "file:///tmp/docs" }),
      "UNSUPPORTED_START_URL"
    );
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

describe("M1 URL resolver", () => {
  test("resolves a relative URL against its parent", () => {
    const result = resolveUrl("../guide", "https://Example.test/docs/api/");
    assertResultOk(result);
    assertEqual(result.value.resolvedUrl, "https://example.test/docs/guide");
  });

  test("rejects unsupported protocols", () => {
    assertResultError(resolveUrl("mailto:help@example.test"), "UNSUPPORTED_PROTOCOL");
  });

  test("rejects malformed URLs", () => {
    assertResultError(resolveUrl("not an absolute url"), "INVALID_URL");
  });
});

describe("M1 query policy and normalization", () => {
  test("removes tracking parameters and sorts retained parameters", () => {
    const result = normalizeUrl(
      "HTTPS://Example.TEST:443/docs//guide/%7Euser/?b=2&utm_source=x&a=1#part"
    );
    assertResultOk(result);
    assertEqual(
      result.value.normalizedUrl,
      "https://example.test/docs/guide/~user?a=1&b=2"
    );
    assertDeepEqual(result.value.removedParameters, ["utm_source"]);
  });

  test("retains a configured tracking parameter", () => {
    const result = applyQueryPolicy(
      "https://example.test/docs?utm_source=manual&b=2",
      { retainedParameters: ["utm_source"] }
    );
    assertResultOk(result);
    assertEqual(
      result.value.url.href,
      "https://example.test/docs?b=2&utm_source=manual"
    );
  });

  test("maps equivalent URL forms to one canonical key", () => {
    const first = normalizeUrl("https://example.test:443/docs/#intro");
    const second = normalizeUrl("https://EXAMPLE.test/docs");
    assertResultOk(first);
    assertResultOk(second);
    assertEqual(first.value.canonicalKey, second.value.canonicalKey);
    assertEqual(
      createCanonicalKey(first.value.normalizedUrl),
      "https://example.test/docs"
    );
  });
});

describe("M1 link filters", () => {
  test("detects blocked file extensions case-insensitively", () => {
    assertEqual(getPathExtension("https://example.test/manual.PDF"), "pdf");
    assertTrue(isBlockedExtension("https://example.test/manual.PDF").blocked);
  });

  test("does not block an extension word inside a directory", () => {
    assertFalse(isBlockedExtension("https://example.test/pdf/guide").blocked);
  });

  test("detects unsafe action paths", () => {
    const result = inspectUnsafeAction("https://example.test/account/logout");
    assertTrue(result.unsafe);
    assertEqual(result.matchedPattern, "logout");
  });

  test("detects unsafe action query values", () => {
    const result = inspectUnsafeAction(
      "https://example.test/account?action=delete"
    );
    assertTrue(result.unsafe);
    assertEqual(result.location, "query:action");
  });
});

describe("M1 scope guard", () => {
  const baseConfig = {
    allowedOrigin: "https://example.test",
    allowedPathPrefix: "/docs",
    maxDepth: 2,
    maxPages: 10
  };

  test("allows a valid in-scope documentation URL", () => {
    const result = evaluateUrlScope(
      "https://example.test/docs/guide",
      baseConfig,
      { depth: 1, currentPageCount: 0 }
    );
    assertTrue(result.allowed);
    assertEqual(result.reasonCode, "ALLOWED");
  });

  test("rejects a different origin", () => {
    const result = evaluateUrlScope(
      "https://other.test/docs/guide",
      baseConfig
    );
    assertEqual(result.reasonCode, "OUTSIDE_ORIGIN");
  });

  test("uses path-segment-aware prefix matching", () => {
    const result = evaluateUrlScope(
      "https://example.test/docsets/guide",
      baseConfig
    );
    assertEqual(result.reasonCode, "OUTSIDE_PATH");
  });

  test("applies include and exclude patterns", () => {
    const includeMiss = evaluateUrlScope(
      "https://example.test/docs/api",
      { ...baseConfig, includePatterns: ["*/guide*"] }
    );
    assertEqual(includeMiss.reasonCode, "INCLUDE_PATTERN_MISS");

    const excluded = evaluateUrlScope(
      "https://example.test/docs/private/guide",
      { ...baseConfig, excludePatterns: ["*/private/*"] }
    );
    assertEqual(excluded.reasonCode, "EXCLUDED_PATTERN");
  });

  test("rejects downloads and unsafe action links", () => {
    const download = evaluateUrlScope(
      "https://example.test/docs/manual.pdf",
      baseConfig
    );
    assertEqual(download.reasonCode, "BLOCKED_EXTENSION");

    const action = evaluateUrlScope(
      "https://example.test/docs/logout",
      baseConfig
    );
    assertEqual(action.reasonCode, "UNSAFE_ACTION_LINK");
  });

  test("enforces depth and page limits", () => {
    const depth = evaluateUrlScope(
      "https://example.test/docs/deep",
      baseConfig,
      { depth: 3, currentPageCount: 0 }
    );
    assertEqual(depth.reasonCode, "MAX_DEPTH_REACHED");

    const pages = evaluateUrlScope(
      "https://example.test/docs/guide",
      baseConfig,
      { depth: 1, currentPageCount: 10 }
    );
    assertEqual(pages.reasonCode, "MAX_PAGE_LIMIT");
  });
});

describe("M1 duplicate registry and integrated pipeline", () => {
  test("rejects duplicate canonical URLs and preserves state", () => {
    const registry = createDuplicateUrlRegistry();
    assertResultOk(registry.register("https://example.test/docs", "QUEUED"));
    assertResultError(
      registry.register("https://example.test/docs", "QUEUED"),
      "DUPLICATE_URL"
    );
    assertEqual(registry.getState("https://example.test/docs"), "QUEUED");
    assertDeepEqual(registry.snapshot(), [
      { canonicalKey: "https://example.test/docs", state: "QUEUED" }
    ]);
  });

  test("resolves, normalizes, and classifies a URL in one operation", () => {
    const result = inspectUrl(
      "/docs/start?utm_medium=x&page=2#section",
      "https://example.test/",
      {
        allowedOrigin: "https://example.test",
        allowedPathPrefix: "/docs"
      }
    );
    assertResultOk(result);
    assertEqual(
      result.value.normalizedUrl,
      "https://example.test/docs/start?page=2"
    );
    assertTrue(result.value.scope.allowed);
  });
});

void run();
