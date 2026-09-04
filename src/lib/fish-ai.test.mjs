import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FISH_AI_MAX_BASE64_BYTES,
  resolveOpenAiApiKey,
  shouldSkipOpenAiEstimate,
  visionImageUrl,
  visionMimeSupported,
} from "./fish-ai-vision.ts";
import {
  estimateFishFromPhoto,
  fallbackEstimate,
  normalizeEstimate,
  parseAiJsonContent,
} from "./fish-ai.ts";
import {
  GUEST_AI_MISSING_KEY_NOTE,
  GUEST_AI_TIMEOUT_NOTE,
} from "./guest-copy.ts";
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

  it("allows a public https JPEG when there is no inline payload", () => {
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

  it("prefers an inlined data URL over the Blob URL", () => {
    const url = visionImageUrl({
      mimeType: "image/jpeg",
      imageUrl: "https://blob.example/catch.jpg",
      imageBase64: "abc123",
    });
    assert.equal(url, "data:image/jpeg;base64,abc123");
  });
});

describe("estimate fallback", () => {
  it("uses Unknown and omits fake 18 / 3.5 sizes", () => {
    const missing = fallbackEstimate("missing-key");
    assert.equal(missing.breed, UNKNOWN_FISH_BREED);
    assert.notEqual(UNKNOWN_FISH_BREED.toLowerCase(), "unidentified gulf fish");
    assert.equal(missing.lengthInches, null);
    assert.equal(missing.weightLbs, null);
    assert.equal(missing.provider, "fallback");
    assert.equal(missing.notes, GUEST_AI_MISSING_KEY_NOTE);
    assert.notEqual(missing.lengthInches, 18);
    assert.notEqual(missing.weightLbs, 3.5);

    const timeout = fallbackEstimate("timeout");
    assert.equal(timeout.notes, GUEST_AI_TIMEOUT_NOTE);
    assert.equal(timeout.lengthInches, null);
  });
});

describe("normalizeEstimate", () => {
  it("does not invent 18 inches / 3 lb when the model omits numbers", () => {
    const estimate = normalizeEstimate({ breed: "Redfish" }, "openai");
    assert.equal(estimate.breed, "Redfish");
    assert.equal(estimate.lengthInches, null);
    assert.equal(estimate.weightLbs, null);
    assert.equal(estimate.provider, "openai");
  });

  it("keeps real numeric guesses", () => {
    const estimate = normalizeEstimate(
      { breed: "Trout", lengthInches: 22.4, weightLbs: 4.1, confidence: 0.8 },
      "openai",
    );
    assert.equal(estimate.lengthInches, 22.4);
    assert.equal(estimate.weightLbs, 4.1);
  });
});

describe("parseAiJsonContent", () => {
  it("accepts fenced JSON", () => {
    const parsed = parseAiJsonContent(
      '```json\n{"breed":"Redfish","lengthInches":20}\n```',
    );
    assert.equal(parsed?.breed, "Redfish");
    assert.equal(parsed?.lengthInches, 20);
  });
});

describe("estimateFishFromPhoto", () => {
  it("returns a missing-key fallback without calling OpenAI", async () => {
    let called = false;
    const estimate = await estimateFishFromPhoto(
      { mimeType: "image/jpeg", imageUrl: "https://blob.example/a.jpg" },
      {
        apiKey: "",
        fetchImpl: async () => {
          called = true;
          throw new Error("should not fetch");
        },
      },
    );
    assert.equal(called, false);
    assert.equal(estimate.provider, "fallback");
    assert.equal(estimate.fallbackReason, "missing-key");
    assert.equal(estimate.breed, "Unknown");
    assert.equal(estimate.lengthInches, null);
    assert.equal(estimate.weightLbs, null);
    assert.equal(estimate.notes, GUEST_AI_MISSING_KEY_NOTE);
  });

  it("skips HEIC as unsupported-type", async () => {
    const estimate = await estimateFishFromPhoto(
      { mimeType: "image/heic", imageUrl: "https://blob.example/a.heic" },
      { apiKey: "sk-test" },
    );
    assert.equal(estimate.fallbackReason, "unsupported-type");
    assert.equal(estimate.lengthInches, null);
  });

  it("times out instead of hanging, without fake sizes", async () => {
    const estimate = await estimateFishFromPhoto(
      { mimeType: "image/jpeg", imageBase64: "abc" },
      {
        apiKey: "sk-test",
        timeoutMs: 25,
        fetchImpl: () => new Promise(() => {}),
      },
    );
    assert.equal(estimate.provider, "fallback");
    assert.equal(estimate.fallbackReason, "timeout");
    assert.equal(estimate.lengthInches, null);
    assert.equal(estimate.weightLbs, null);
    assert.equal(estimate.notes, GUEST_AI_TIMEOUT_NOTE);
  });

  it("inlines the JPEG and returns a real estimate on success", async () => {
    /** @type {string | undefined} */
    let sentBody;
    const estimate = await estimateFishFromPhoto(
      {
        mimeType: "image/jpeg",
        imageUrl: "https://blob.example/catch.jpg",
        imageBase64: "abc123",
      },
      {
        apiKey: "sk-test",
        fetchImpl: async (_url, init) => {
          sentBody = String(init?.body ?? "");
          return {
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      breed: "Redfish",
                      lengthInches: 24,
                      weightLbs: 6.2,
                      confidence: 0.9,
                      notes: "Slot red on the deck.",
                    }),
                  },
                },
              ],
            }),
          };
        },
      },
    );
    assert.match(String(sentBody), /data:image\/jpeg;base64,abc123/);
    assert.match(String(sentBody), /json_object/);
    assert.equal(String(sentBody).includes("json_schema"), false);
    assert.equal(estimate.provider, "openai");
    assert.equal(estimate.breed, "Redfish");
    assert.equal(estimate.lengthInches, 24);
    assert.equal(estimate.weightLbs, 6.2);
  });

  it("maps OpenAI HTTP errors to a blank-size fallback", async () => {
    const estimate = await estimateFishFromPhoto(
      { mimeType: "image/jpeg", imageBase64: "abc" },
      {
        apiKey: "sk-test",
        fetchImpl: async () => ({
          ok: false,
          status: 401,
          text: async () => "invalid_api_key",
        }),
      },
    );
    assert.equal(estimate.provider, "fallback");
    assert.equal(estimate.fallbackReason, "openai-error");
    assert.equal(estimate.lengthInches, null);
  });
});
