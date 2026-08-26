import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GUEST_AI_UNAVAILABLE_NOTE,
  guestSafeAiNotes,
} from "./guest-copy";

const LEAKED =
  "AI estimation unavailable (set OPENAI_API_KEY). Logged with placeholder estimates — edit after weigh-in if needed.";

describe("guestSafeAiNotes", () => {
  it("rewrites the stored Brag Board leak", () => {
    assert.equal(guestSafeAiNotes(LEAKED), GUEST_AI_UNAVAILABLE_NOTE);
  });

  it("rewrites env names, setup hints, and stack-ish text", () => {
    assert.equal(
      guestSafeAiNotes("Missing EVENT_PIN"),
      GUEST_AI_UNAVAILABLE_NOTE,
    );
    assert.equal(
      guestSafeAiNotes("Set BLOB_READ_WRITE_TOKEN on the server"),
      GUEST_AI_UNAVAILABLE_NOTE,
    );
    assert.equal(
      guestSafeAiNotes("process.env exploded"),
      GUEST_AI_UNAVAILABLE_NOTE,
    );
    assert.equal(
      guestSafeAiNotes("Error: boom\n    at estimateFishFromPhoto (fish-ai.ts:80:5)"),
      GUEST_AI_UNAVAILABLE_NOTE,
    );
  });

  it("keeps real fish notes and empty values", () => {
    assert.equal(
      guestSafeAiNotes("Looks like a slot red — set the hook and smile."),
      "Looks like a slot red — set the hook and smile.",
    );
    assert.equal(guestSafeAiNotes(null), null);
    assert.equal(guestSafeAiNotes("   "), null);
  });
});
