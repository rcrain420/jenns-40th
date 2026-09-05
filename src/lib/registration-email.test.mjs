import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  amountDueLine,
  registrationConfirmationCopy,
} from "./registration-email-copy.ts";

const TEAM_URL = "https://officialishfishingtournament.com/team";
const VENMO_URL = "https://venmo.com/u/Jennski";

function welcomeCopy(overrides = {}) {
  return registrationConfirmationCopy({
    teamName: "Pretty Pier Pressure",
    amountLabel: "$150.00",
    teamUrl: TEAM_URL,
    venmoHandle: "Jennski",
    venmoUrl: VENMO_URL,
    eventName: "Official-ish Fishing Tournament for Jenn's 40th Birthday",
    shortName: "Jenn's 40th",
    dateLabel: "October 9–10, 2026",
    venue: "Boatmen’s Club Bar & Marina",
    footerScript: "See you in Rockport!",
    adultSeatFeeLabel: "$75",
    paidSeatCount: 2,
    youthSeatCount: 1,
    ...overrides,
  });
}

describe("registration welcome email", () => {
  it("confirms the team, Venmo, My Team, and date/place — not unlock or invitees", () => {
    const message = welcomeCopy();

    assert.equal(
      message.subject,
      "You're registered — Pretty Pier Pressure at Jenn's 40th",
    );
    assert.ok(message.text.includes("Pretty Pier Pressure is registered"));
    assert.ok(message.text.includes("October 9–10, 2026"));
    assert.ok(message.text.includes("Boatmen’s Club Bar & Marina"));
    assert.ok(message.text.includes("Venmo Jennski for entry"));
    assert.ok(message.text.includes(VENMO_URL));
    assert.ok(message.text.includes("$150.00"));
    assert.ok(message.text.includes("2 adult seats"));
    assert.ok(message.text.includes("1 youth seat is free"));
    assert.ok(message.text.includes("Kids are free"));
    assert.ok(message.text.includes("$75 covers each adult seat"));
    assert.ok(message.text.includes(TEAM_URL));
    assert.ok(message.text.includes("copy the share link"));
    assert.ok(message.html.includes(TEAM_URL));
    assert.ok(message.html.includes("Open My Team"));
    assert.ok(message.html.includes(VENMO_URL));

    assert.equal(message.text.includes("/unlock"), false);
    assert.equal(message.html.includes("/unlock"), false);
    assert.equal(/event PIN/i.test(message.text), false);
    assert.equal(/magic link/i.test(message.text), false);
    assert.equal(/Hey captain/i.test(message.text), false);
    assert.equal(/Join the boat email/i.test(message.text), false);

    const leaked = [
      "EVENT_PIN",
      "SESSION_SECRET",
      "RESEND_API_KEY",
      "RESEND_FROM",
      "OPENAI_API_KEY",
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

  it("still states kids are free when seat counts are omitted", () => {
    const line = amountDueLine({
      amountLabel: "$75.00",
      adultSeatFeeLabel: "$75",
    });
    assert.equal(
      line,
      "Amount due: $75.00. Kids are free; $75 covers each adult seat.",
    );
  });
});
