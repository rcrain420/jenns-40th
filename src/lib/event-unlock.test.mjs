import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const {
  EVENT_UNLOCK_PURPOSE,
  evaluateEventUnlockToken,
  eventUnlockPath,
  issueEventUnlockToken,
  unlockLandingPath,
  verifyEventUnlockToken,
} = await import("./event-unlock-token.ts");
const TEAM_ID = "team_pretty_pier";
const EMAIL = "Ada@Example.com";

describe("event unlock tokens", () => {
  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  });

  it("issues an unguessable signed token bound to the registration email", () => {
    const { token, expiresAt } = issueEventUnlockToken({
      teamId: TEAM_ID,
      email: EMAIL,
    });

    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    assert.ok(expiresAt.getTime() > Date.now());

    const verified = verifyEventUnlockToken(token);
    assert.equal(verified.ok, true);
    assert.equal(verified.teamId, TEAM_ID);
    assert.equal(verified.email, "ada@example.com");
  });

  it("unlocks from a valid token", () => {
    const { token } = issueEventUnlockToken({
      teamId: TEAM_ID,
      email: EMAIL,
    });
    const unlocked = evaluateEventUnlockToken(token);
    assert.deepEqual(
      {
        ok: unlocked.ok,
        via: unlocked.via,
        teamId: unlocked.teamId,
        email: unlocked.email,
      },
      { ok: true, via: "link", teamId: TEAM_ID, email: "ada@example.com" },
    );
  });

  it("rejects a tampered or leftover token", () => {
    const { token } = issueEventUnlockToken({
      teamId: TEAM_ID,
      email: EMAIL,
    });
    const [body] = token.split(".");
    const tampered = `${body}.not-a-real-signature`;

    assert.deepEqual(verifyEventUnlockToken(tampered), {
      ok: false,
      reason: "invalid",
    });
    assert.equal(evaluateEventUnlockToken("not-a-token").ok, false);
    assert.equal(evaluateEventUnlockToken("").ok, false);
  });

  it("rejects an expired token", () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const { token } = issueEventUnlockToken({
      teamId: TEAM_ID,
      email: EMAIL,
      now,
      ttlSeconds: 60,
    });

    const expired = verifyEventUnlockToken(
      token,
      new Date("2026-08-01T12:02:00.000Z"),
    );
    assert.deepEqual(expired, { ok: false, reason: "expired" });

    const evaluated = evaluateEventUnlockToken(
      token,
      new Date("2026-08-01T12:02:00.000Z"),
    );
    assert.equal(evaluated.ok, false);
    assert.match(evaluated.error, /expired/i);
    assert.equal(/\bPIN\b/i.test(evaluated.error), false);
  });

  it("does not treat a different purpose as an event unlock", () => {
    const { token } = issueEventUnlockToken({
      teamId: TEAM_ID,
      email: EMAIL,
    });
    const [body] = token.split(".");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    assert.equal(payload.purpose, EVENT_UNLOCK_PURPOSE);

    payload.purpose = "admin";
    const forgedBody = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const signature = createHmac("sha256", process.env.SESSION_SECRET)
      .update(forgedBody)
      .digest("base64url");

    assert.deepEqual(verifyEventUnlockToken(`${forgedBody}.${signature}`), {
      ok: false,
      reason: "invalid",
    });
  });
});

describe("event unlock landing", () => {
  it("always lands a valid unlock on the Livewell, never success or My team", () => {
    assert.equal(unlockLandingPath(), "/catches?unlocked=1");
    assert.equal(unlockLandingPath().startsWith("/register/success"), false);
    assert.equal(unlockLandingPath().startsWith("/team"), false);
  });

  it("success-page unlock path stays on this origin", () => {
    const { token } = issueEventUnlockToken({
      teamId: TEAM_ID,
      email: EMAIL,
    });
    const path = eventUnlockPath(token);
    assert.equal(path.startsWith("/unlock?token="), true);
    assert.equal(path.includes("officialishfishingtournament.com"), false);
    assert.equal(path.includes("http"), false);
    assert.equal(verifyEventUnlockToken(token).ok, true);
  });
});
