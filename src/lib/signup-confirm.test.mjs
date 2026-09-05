import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isJoinNextPath,
  shouldSendSignupConfirmEmail,
} from "./signup-confirm.ts";

describe("signup confirm-account mail", () => {
  it("skips when join already verified the account", () => {
    assert.equal(
      shouldSendSignupConfirmEmail({
        emailVerified: true,
        next: "/catches",
      }),
      false,
    );
  });

  it("skips when Join the boat will immediately verify them", () => {
    assert.equal(
      shouldSendSignupConfirmEmail({
        emailVerified: false,
        next: "/join?token=abc",
      }),
      false,
    );
    assert.equal(
      shouldSendSignupConfirmEmail({
        emailVerified: false,
        next: "/j/AbCdEfGhIjKl",
      }),
      false,
    );
    assert.equal(isJoinNextPath("/join?token=abc"), true);
    assert.equal(isJoinNextPath("/join"), true);
    assert.equal(isJoinNextPath("/j/AbCdEfGhIjKl"), true);
    assert.equal(isJoinNextPath("/join/AbCdEfGhIjKl"), true);
  });

  it("still sends for a standalone signup that is not joining", () => {
    assert.equal(
      shouldSendSignupConfirmEmail({
        emailVerified: false,
        next: "/catches",
      }),
      true,
    );
    assert.equal(isJoinNextPath("/catches"), false);
    assert.equal(isJoinNextPath("/join-waitlist"), false);
  });
});
