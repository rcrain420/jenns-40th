import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FISH_AI_MAX_BASE64_BYTES,
  resolveOpenAiApiKey,
  shouldSkipOpenAiEstimate,
  visionImageUrl,
  visionMimeSupported,
} from "./fish-ai-vision.ts";
import { UNKNOWN_FISH_BREED } from "./fish-species.ts";

describe("visionMimeSupported", () => {
  it("allows jpeg/png/webp/gif and rejects heic", () => {
    assert.equal(visionMimeSupported("image/jpeg"), true);
    assert.equal(visionMimeSupported("image/png"), true);
    assert.equal(visionMimeSupported("image/webp"), true);
    assert.equal(visionMimeSupported("image/gif"), true);
    assert.equal(visionMimeSupported("image/heic"), false);
    assert.equal(visionMimeSupported("image/heif"), false);
  });
});

describe("shouldSkipOpenAiEstimate", () => {
  it("skips when the API key is missing", () => {
    assert.equal(
      shouldSkipOpenAiEstimate(
        { mimeType: "image/jpeg", imageUrl: "https://example.com/a.jpg" },
        "",
      ),
      "missing-key",
    );
    assert.equal(resolveOpenAiApiKey(""), "");
    assert.equal(resolveOpenAiApiKey("  sk-test  "), "sk-test");
  });

  it("skips HEIC instead of sending a body OpenAI will stall on", () => {
    assert.equal(
      shouldSkipOpenAiEstimate(
        { mimeType: "image/heic", imageUrl: "https://example.com/catch.heic" },
        "sk-test",
      ),
      "unsupported-type",
    );
  });

  it("skips oversized data URLs and empty payloads", () => {
    const huge = "a".repeat(Math.floor((FISH_AI_MAX_BASE64_BYTES * 4) / 3) + 20);
    assert.equal(
      shouldSkipOpenAiEstimate(
        { mimeType: "image/jpeg", imageBase64: huge },
        "sk-test",
      ),
      "no-usable-image",
    );
    assert.equal(
      shouldSkipOpenAiEstimate({ mimeType: "image/jpeg" }, "sk-test"),
      "no-usable-image",
    );
  });

  it("allows a public https JPEG", () => {
    assert.equal(
      shouldSkipOpenAiEstimate(
        { mimeType: "image/jpeg", imageUrl: "https://blob.example/catch.jpg" },
        "sk-test",
      ),
      null,
    );
    assert.equal(
      visionImageUrl({
        mimeType: "image/jpeg",
        imageUrl: "https://blob.example/catch.jpg",
      }),
      "https://blob.example/catch.jpg",
    );
  });
});

describe("estimate fallback breed", () => {
  it("uses Unknown instead of a freeform gulf label", () => {
    assert.equal(UNKNOWN_FISH_BREED, "Unknown");
    assert.notEqual(UNKNOWN_FISH_BREED.toLowerCase(), "unidentified gulf fish");
  });
});
