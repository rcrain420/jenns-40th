import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  anglerInviteSharePath,
  generateInviteCode,
  isInviteCodeFormat,
  joinReturnPath,
  teamInviteSharePath,
} from "./team-invite-code.ts";

describe("short team invite codes", () => {
  it("generates an unguessable shareable code without a JWT", () => {
    const code = generateInviteCode();
    assert.equal(isInviteCodeFormat(code), true);
    assert.equal(code.includes("."), false);
    assert.equal(code.startsWith("eyJ"), false);
    assert.match(teamInviteSharePath(code), /^\/j\/[A-Za-z0-9_-]+$/);
  });

  it("rejects guessable or leftover token strings", () => {
    assert.equal(isInviteCodeFormat("abc"), false);
    assert.equal(isInviteCodeFormat("eyJ2IjoxLCJwdXJwb3NlIjoidGVhbS1pbnZpdGUi"), false);
    assert.equal(isInviteCodeFormat(""), false);
  });

  it("builds a personal join path on the short code", () => {
    const path = anglerInviteSharePath("AbCdEfGhIjKl", "Jenn@Example.com", "Jenn");
    assert.equal(path.startsWith("/j/AbCdEfGhIjKl?"), true);
    assert.equal(path.includes("token="), false);
    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    assert.equal(params.get("email"), "jenn@example.com");
    assert.equal(params.get("name"), "Jenn");
  });

  it("returns joiners to the short URL after login", () => {
    assert.equal(
      joinReturnPath({ code: "AbCdEfGhIjKl", email: "pat@example.com" }),
      "/j/AbCdEfGhIjKl?email=pat%40example.com",
    );
    const legacy = joinReturnPath({ token: "legacy.jwt", name: "Pat" });
    assert.equal(legacy.startsWith("/join?"), true);
    assert.equal(legacy.includes("token=legacy.jwt"), true);
  });
});
