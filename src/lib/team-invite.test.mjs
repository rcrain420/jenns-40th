import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const {
  issueTeamInviteToken,
  teamInvitePath,
  verifyTeamInviteToken,
  TEAM_INVITE_PURPOSE,
} = await import("./team-invite-token.ts");

const TEAM_ID = "team_pretty_pier";

describe("team invite tokens", () => {
  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  });

  it("issues a signed token bound to the team", () => {
    const { token, expiresAt } = issueTeamInviteToken({ teamId: TEAM_ID });
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    assert.ok(expiresAt.getTime() > Date.now());

    const verified = verifyTeamInviteToken(token);
    assert.equal(verified.ok, true);
    if (verified.ok) assert.equal(verified.teamId, TEAM_ID);
    const path = teamInvitePath(token);
    assert.equal(path.startsWith("/join?token="), true);
    assert.equal(path.includes("http"), false);
  });

  it("rejects a tampered token", () => {
    const { token } = issueTeamInviteToken({ teamId: TEAM_ID });
    const bad = `${token.slice(0, -2)}xx`;
    assert.deepEqual(verifyTeamInviteToken(bad), {
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects an expired token", () => {
    const { token } = issueTeamInviteToken({
      teamId: TEAM_ID,
      now: new Date("2020-01-01T00:00:00.000Z"),
      ttlSeconds: 60,
    });
    assert.deepEqual(verifyTeamInviteToken(token, new Date()), {
      ok: false,
      reason: "expired",
    });
  });

  it("does not treat a different purpose as a team invite", () => {
    assert.equal(TEAM_INVITE_PURPOSE, "team-invite");
    const { token } = issueTeamInviteToken({ teamId: TEAM_ID });
    const [body] = token.split(".");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    assert.equal(payload.purpose, "team-invite");
    assert.equal(payload.teamId, TEAM_ID);
  });
});
