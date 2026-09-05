import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { captainInviteEmailCopy } from "./captain-invite-email-copy.ts";
import { shouldSendCaptainInvite } from "./captain-invite-plan.ts";

describe("captain invite email", () => {
  it("stays short and off payment, with a join link", () => {
    const inviteUrl =
      "https://officialishfishingtournament.com/j/AbCdEfGhIjKl?email=captain%40example.com";
    const message = captainInviteEmailCopy({
      captainName: "Capt. Ron",
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
    assert.ok(message.text.includes("Pretty Pier Pressure added you as captain"));
    assert.ok(message.text.includes("create an account"));
    assert.ok(message.text.includes("Google"));
    assert.ok(message.text.includes("Livewell"));
    assert.ok(message.text.includes("not a $75 angler seat"));
    assert.equal(/\bPIN\b/.test(message.text), false);
    assert.equal(/venmo/i.test(message.text), false);
    assert.equal(/added you as an angler/i.test(message.text), false);
  });
});

describe("shouldSendCaptainInvite", () => {
  it("sends only when the email is new to this boat", () => {
    assert.deepEqual(
      shouldSendCaptainInvite({
        email: "ron@example.com",
        alreadyOnThisBoat: false,
        onAnotherTeam: false,
      }),
      { send: true },
    );
    assert.deepEqual(
      shouldSendCaptainInvite({
        email: "ron@example.com",
        alreadyOnThisBoat: true,
        onAnotherTeam: false,
      }),
      { send: false, skipReason: "joined" },
    );
    assert.deepEqual(
      shouldSendCaptainInvite({
        email: "ron@example.com",
        alreadyOnThisBoat: false,
        onAnotherTeam: true,
      }),
      { send: false, skipReason: "other-team" },
    );
    assert.deepEqual(
      shouldSendCaptainInvite({
        email: "",
        alreadyOnThisBoat: false,
        onAnotherTeam: false,
      }),
      { send: false, skipReason: "empty" },
    );
  });
});
