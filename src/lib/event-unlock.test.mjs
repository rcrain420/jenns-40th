import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";
process.env.EVENT_PIN ??= "2468";

const {
  EVENT_UNLOCK_PURPOSE,
  checkEventPin,
  evaluateEventPin,
  evaluateEventUnlockToken,
  issueEventUnlockToken,
  verifyEventUnlockToken,
} = await import("./event-unlock-token.ts");
const { registrationConfirmationCopy } = await import(
  "./registration-email-copy.ts"
);

const TEAM_ID = "team_pretty_pier";
const EMAIL = "Ada@Example.com";

describe("event unlock tokens", () => {
  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
    process.env.EVENT_PIN = "2468";
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

  it("unlocks from a valid token (same grant as a correct PIN)", () => {
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

describe("event PIN fallback", () => {
  it("still unlocks with the correct PIN", () => {
    assert.equal(checkEventPin("2468"), true);
    assert.deepEqual(evaluateEventPin("2468"), { ok: true, via: "pin" });
  });

  it("rejects a wrong PIN", () => {
    assert.equal(checkEventPin("0000"), false);
    const result = evaluateEventPin("0000");
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
  });
});

describe("registration confirmation email", () => {
  it("puts a working magic link in the email body", () => {
    const { token } = issueEventUnlockToken({
      teamId: TEAM_ID,
      email: EMAIL,
    });
    const unlockUrl = `https://officialishfishingtournament.com/unlock?token=${encodeURIComponent(token)}`;
    const message = registrationConfirmationCopy({
      teamName: "Pretty Pier Pressure",
      amountLabel: "$150.00",
      unlockUrl,
      venmoHandle: "@Officialish-Tournament",
      venmoUrl: "https://venmo.com/u/Officialish-Tournament",
      eventName: "Official-ish Fishing Tournament for Jenn's 40th Birthday",
      shortName: "Jenn's 40th",
      dateLabel: "October 9–10, 2026",
      venue: "Boatmen’s Club Bar & Marina",
      footerScript: "See you in Rockport!",
    });

    assert.ok(message.text.includes(unlockUrl));
    assert.ok(message.html.includes(unlockUrl));
    assert.ok(message.html.includes("Unlock catch logging"));
    assert.equal(verifyEventUnlockToken(token).ok, true);

    const leaked = [
      "EVENT_PIN",
      "SESSION_SECRET",
      "RESEND_API_KEY",
      "ADMIN_PASSWORD",
    ];
    for (const name of leaked) {
      assert.equal(message.text.includes(name), false, `text leaked ${name}`);
      assert.equal(message.html.includes(name), false, `html leaked ${name}`);
      assert.equal(
        message.subject.includes(name),
        false,
        `subject leaked ${name}`,
      );
    }
  });
});
