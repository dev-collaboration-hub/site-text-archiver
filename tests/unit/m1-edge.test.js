import {
  assertEqual,
  assertResultOk
} from "../assertions.js";
import { describe, test } from "../test-runner.js";
import { resolveUrl } from "../../src/crawler/url-resolver.js";
import { normalizeUrl } from "../../src/crawler/url-normalizer.js";

describe("M1 URL edge cases", () => {
  test("accepts an absolute HTTPS URL without a parent", () => {
    const result = resolveUrl("https://example.test/docs/guide");
    assertResultOk(result);
    assertEqual(result.value.resolvedUrl, "https://example.test/docs/guide");
  });

  test("normalizes Unicode hostname and encoded path deterministically", () => {
    const result = normalizeUrl("https://münich.example/docs/%E2%9C%93/");
    assertResultOk(result);
    assertEqual(
      result.value.normalizedUrl,
      "https://xn--mnich-kva.example/docs/%E2%9C%93"
    );
  });

  test("preserves repeated content-changing query values", () => {
    const result = normalizeUrl(
      "https://example.test/docs?tag=b&tag=a&utm_campaign=test"
    );
    assertResultOk(result);
    assertEqual(
      result.value.normalizedUrl,
      "https://example.test/docs?tag=a&tag=b"
    );
  });
});
