import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const { emailedAnglersForJoinInvite } = await import(
  "./angler-join-recipients.ts"
);
const { JOIN_SITE_ACCESS } = await import("./join-site-access.ts");
const { teamInviteEmailCopy } = await import("./team-invite-email-copy.ts");
const {
  anglerInvitePath,
  issueTeamInviteToken,
  verifyTeamInviteToken,
} = await import("./team-invite-token.ts");

const TEAM_ID = "team_test_qa";

describe("register / Invite join emails", () => {
  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  });

  it("fires Join the boat only for emailed seats, never name-only", () => {
    const recipients = emailedAnglersForJoinInvite([
      { fullName: "Pat Email", email: "pat@example.com" },
      { fullName: "Kid Walkup", email: null },
      { fullName: "Blank", email: "  " },
      { fullName: "Pat Again", email: "pat@example.com" },
    ]);
    assert.deepEqual(
      recipients.map((r) => ({ name: r.fullName, email: r.email })),
      [{ name: "Pat Email", email: "pat@example.com" }],
    );
  });

  it("builds a working Join the boat link for each emailed angler", () => {
    const recipients = emailedAnglersForJoinInvite([
      { fullName: "Emailed Angler", email: "angler@example.com" },
      { fullName: "Name Only", email: null },
    ]);
    assert.equal(recipients.length, 1);

    const { token } = issueTeamInviteToken({ teamId: TEAM_ID });
    const path = anglerInvitePath(
      token,
      recipients[0].email,
      recipients[0].fullName,
    );
    const message = teamInviteEmailCopy({
      anglerName: recipients[0].fullName,
      teamName: "TEST QA",
      inviteUrl: `https://officialishfishingtournament.com${path}`,
      eventName: "Official-ish Fishing Tournament for Jenn's 40th Birthday",
      shortName: "Jenn's 40th",
      dateLabel: "October 9–10, 2026",
      venue: "Boatmen’s Club Bar & Marina",
      footerScript: "See you in Rockport!",
    });

    assert.ok(message.html.includes("Join the boat"));
    assert.ok(message.text.includes("Livewell"));
    assert.ok(message.text.includes("no PIN or second unlock"));
    assert.equal(/venmo/i.test(message.text), false);

    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    const verified = verifyTeamInviteToken(params.get("token") ?? "");
    assert.equal(verified.ok, true);
    if (verified.ok) assert.equal(verified.teamId, TEAM_ID);
  });
});

describe("join site access contract", () => {
  it("grants event unlock and drops the confirm gate without making captain or paid roster", () => {
    assert.equal(JOIN_SITE_ACCESS.grantsEventUnlock, true);
    assert.equal(JOIN_SITE_ACCESS.verifiesEmail, true);
    assert.equal(JOIN_SITE_ACCESS.makesCaptain, false);
    assert.equal(JOIN_SITE_ACCESS.addsPaidRoster, false);
  });
});
