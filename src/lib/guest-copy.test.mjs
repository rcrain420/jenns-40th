import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GUEST_AI_MISSING_KEY_NOTE,
  GUEST_AI_NO_IMAGE_NOTE,
  GUEST_AI_PROVIDER_ERROR_NOTE,
  GUEST_AI_TIMEOUT_NOTE,
  GUEST_AI_UNAVAILABLE_NOTE,
  GUEST_AI_UNSUPPORTED_PHOTO_NOTE,
  GUEST_REGISTRATION_EMAIL_FAILED,
  GUEST_REGISTRATION_EMAIL_SENT,
  GUEST_REGISTRATION_EMAIL_UNKNOWN,
  guestCopyHasInternalLeak,
  guestSafeAiNotes,
} from "./guest-copy.ts";

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
      guestSafeAiNotes(
        "Error: boom\n    at estimateFishFromPhoto (fish-ai.ts:80:5)",
      ),
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

  it("flags RESEND_* and other env names", () => {
    assert.equal(guestCopyHasInternalLeak("Missing RESEND_API_KEY"), true);
    assert.equal(guestCopyHasInternalLeak("Use RESEND_FROM instead"), true);
    assert.equal(guestCopyHasInternalLeak("EVENT_PIN is unset"), true);
  });
});

describe("AI fallback guest notes", () => {
  it("explains why AI did not run without leaking env names", () => {
    const notes = [
      GUEST_AI_MISSING_KEY_NOTE,
      GUEST_AI_TIMEOUT_NOTE,
      GUEST_AI_UNSUPPORTED_PHOTO_NOTE,
      GUEST_AI_NO_IMAGE_NOTE,
      GUEST_AI_PROVIDER_ERROR_NOTE,
      GUEST_AI_UNAVAILABLE_NOTE,
    ];
    for (const text of notes) {
      assert.equal(guestCopyHasInternalLeak(text), false, text);
      assert.equal(text.includes("OPENAI_API_KEY"), false, text);
      assert.equal(guestSafeAiNotes(text), text);
    }
    assert.match(GUEST_AI_MISSING_KEY_NOTE, /missing key/i);
    assert.match(GUEST_AI_MISSING_KEY_NOTE, /configured/i);
  });
});

describe("registration mail status copy", () => {
  it("does not leak env names on the success page", () => {
    for (const text of [
      GUEST_REGISTRATION_EMAIL_FAILED,
      GUEST_REGISTRATION_EMAIL_SENT,
      GUEST_REGISTRATION_EMAIL_UNKNOWN,
    ]) {
      assert.equal(guestCopyHasInternalLeak(text), false, text);
      for (const name of [
        "OPENAI_API_KEY",
        "EVENT_PIN",
        "SESSION_SECRET",
        "RESEND_API_KEY",
        "RESEND_FROM",
        "RESEND_API",
      ]) {
        assert.equal(text.includes(name), false, `${name} in ${text}`);
      }
    }
  });
});
