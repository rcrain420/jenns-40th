import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const { teamInviteEmailCopy } = await import("./team-invite-email-copy.ts");
const {
  anglerInvitePath,
  issueTeamInviteToken,
  verifyTeamInviteToken,
} = await import("./team-invite-token.ts");

const TEAM_ID = "team_pretty_pier";

describe("team invite email", () => {
  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  });

  it("puts a working join magic link in the body and stays off payment", () => {
    const inviteUrl =
      "https://officialishfishingtournament.com/join?token=test-token&email=acrain.ccg%2Bcaptain%40gmail.com";
    const message = teamInviteEmailCopy({
      anglerName: "Aaron Crain",
      teamName: "Pretty Pier Pressure",
      inviteUrl,
      eventName: "Official-ish Fishing Tournament for Jenn's 40th Birthday",
      shortName: "Jenn's 40th",
      dateLabel: "October 9–10, 2026",
      venue: "Boatmen’s Club Bar & Marina",
      footerScript: "See you in Rockport!",
    });

    assert.ok(message.text.includes(inviteUrl));
    assert.ok(message.html.includes(inviteUrl.replaceAll("&", "&amp;")));
    assert.ok(message.html.includes("Join the boat"));
    assert.ok(message.text.includes("Pretty Pier Pressure added you as an angler"));
    assert.ok(message.text.includes("event PIN"));
    assert.ok(message.text.includes("Adults without email can stay name-only"));
    assert.equal(/walk-?ups?/i.test(message.text), false);
    assert.equal(/walk-?ups?/i.test(message.html), false);
    assert.ok(message.text.includes("Kids must be registered"));
    assert.ok(message.text.includes("Livewell"));
    assert.ok(message.text.includes("no PIN or second unlock"));
    assert.equal(/venmo/i.test(message.text), false);
    assert.equal(/venmo/i.test(message.html), false);
    assert.equal(/\$/.test(message.text), false);

    const leaked = [
      "EVENT_PIN",
      "SESSION_SECRET",
      "RESEND_API_KEY",
      "RESEND_FROM",
      "EMAIL_FROM",
    ];
    for (const name of leaked) {
      assert.equal(message.text.includes(name), false, `text leaked ${name}`);
      assert.equal(message.html.includes(name), false, `html leaked ${name}`);
    }
  });

  it("builds a personal join path that still verifies as a team invite", () => {
    const { token } = issueTeamInviteToken({ teamId: TEAM_ID });
    const path = anglerInvitePath(
      token,
      "acrain.ccg+captain@gmail.com",
      "Aaron Crain",
    );
    assert.equal(path.startsWith("/join?"), true);
    assert.equal(path.includes("http"), false);
    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    assert.equal(params.get("email"), "acrain.ccg+captain@gmail.com");
    assert.equal(params.get("name"), "Aaron Crain");
    const verified = verifyTeamInviteToken(params.get("token") ?? "");
    assert.equal(verified.ok, true);
    if (verified.ok) assert.equal(verified.teamId, TEAM_ID);
  });
});
