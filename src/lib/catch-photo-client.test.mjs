import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATCH_SUBMIT_TIMEOUT_ERROR,
  CATCH_SUBMIT_TIMEOUT_MS,
  shouldReuseCatchPhoto,
} from "./catch-photo-client.ts";
import { FISH_AI_TIMEOUT_MS } from "./fish-ai-vision.ts";

describe("prepareCatchPhotoForUpload helpers", () => {
  it("reuses small jpeg/webp and recompresses everything else", () => {
    assert.equal(
      shouldReuseCatchPhoto({ size: 120_000, type: "image/jpeg" }),
      true,
    );
    assert.equal(
      shouldReuseCatchPhoto({ size: 120_000, type: "image/heic" }),
      false,
    );
    assert.equal(
      shouldReuseCatchPhoto({ size: 5_000_000, type: "image/jpeg" }),
      false,
    );
  });

  it("client POST timeout outlasts the server vision timeout", () => {
    assert.ok(CATCH_SUBMIT_TIMEOUT_MS > FISH_AI_TIMEOUT_MS);
    assert.match(CATCH_SUBMIT_TIMEOUT_ERROR, /try again/i);
  });
});
