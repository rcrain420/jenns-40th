import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INVITE_THE_BOAT_CAPTAIN_LINES,
  INVITE_THE_BOAT_MEMBER_LINES,
  INVITE_THE_BOAT_REGISTRANT_LINES,
} from "./team-invite-copy.ts";

describe("Invite the boat copy", () => {
  it("stays short and drops the PIN / policy essay", () => {
    const registrant = INVITE_THE_BOAT_REGISTRANT_LINES.join(" ");
    const member = INVITE_THE_BOAT_MEMBER_LINES.join(" ");
    assert.ok(INVITE_THE_BOAT_REGISTRANT_LINES.length >= 2);
    assert.ok(INVITE_THE_BOAT_REGISTRANT_LINES.length <= 4);
    assert.ok(registrant.length < 360);
    assert.match(registrant, /copy or share/i);
    assert.match(registrant, /adult email/i);
    assert.match(registrant, /youth/i);
    assert.match(registrant, /captain email/i);
    assert.match(registrant, /\$75/);
    assert.match(INVITE_THE_BOAT_CAPTAIN_LINES.join(" "), /captain/i);
    assert.match(INVITE_THE_BOAT_CAPTAIN_LINES.join(" "), /\$75/);
    assert.equal(/\bPIN\b/i.test(registrant), false);
    assert.equal(/\bPIN\b/i.test(member), false);
    assert.equal(/18\+/.test(registrant), false);
    assert.equal(/second unlock/i.test(registrant), false);
  });
});
