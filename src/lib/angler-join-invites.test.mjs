import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const {
  emailedAnglersForJoinInvite,
  joinInviteMessagesForTeam,
} = await import("./angler-join-invites.ts");
const { JOIN_SITE_ACCESS } = await import("./join-site-access.ts");
const { verifyTeamInviteToken } = await import("./team-invite-token.ts");

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
    const messages = joinInviteMessagesForTeam({
      teamId: TEAM_ID,
      teamName: "TEST QA",
      anglers: [
        { fullName: "Emailed Angler", email: "angler@example.com" },
        { fullName: "Name Only", email: null },
      ],
    });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].to, "angler@example.com");
    assert.ok(messages[0].html.includes("Join the boat"));
    assert.ok(messages[0].inviteUrl.includes("/join?"));
    assert.equal(/venmo/i.test(messages[0].text), false);

    const url = new URL(messages[0].inviteUrl);
    const verified = verifyTeamInviteToken(url.searchParams.get("token") ?? "");
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
