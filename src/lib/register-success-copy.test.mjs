import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SUCCESS_CREATOR_ACCESS_NOTE,
  SUCCESS_UNLOCK_NOTE,
  SUCCESS_VENMO_BANNER,
  SUCCESS_VENMO_NOTE,
  SUCCESS_YOUTH_ACCOUNT_NOTE,
  SUCCESS_YOUTH_SUMMARY_HEADING,
  SUCCESS_YOUTH_UNLOCK_NOTE,
  SUCCESS_YOUTH_VENMO_MATCH,
} from "./register-success-copy.ts";

const leftover = [
  /confirm(ing)? email is only needed/i,
  /confirm to post/i,
  /must confirm/i,
  /next step:\s*venmo/i,
];

describe("register success leftover copy", () => {
  it("does not tell people they must confirm to post", () => {
    const text = `${SUCCESS_CREATOR_ACCESS_NOTE} ${SUCCESS_UNLOCK_NOTE}`;
    for (const pattern of leftover) {
      assert.equal(pattern.test(text), false, String(pattern));
    }
    assert.match(text, /Join the boat/);
    assert.match(text, /Livewell/);
    assert.equal(/walk-?ups?/i.test(text), false);
  });

  it("does not treat Venmo as a gate to use the site", () => {
    assert.equal(/next step/i.test(SUCCESS_VENMO_BANNER), false);
    assert.match(SUCCESS_VENMO_BANNER, /Optional/);
    assert.match(SUCCESS_VENMO_NOTE, /not required to use the site/);
    assert.match(SUCCESS_VENMO_NOTE, /Unpaid teams stay on the list/);
    assert.equal(/must (pay|venmo)|required to (join|post|unlock)/i.test(SUCCESS_VENMO_NOTE), false);
  });

  it("does not ask a RowRide entry for a team or boat name", () => {
    const text = [
      SUCCESS_YOUTH_ACCOUNT_NOTE,
      SUCCESS_YOUTH_SUMMARY_HEADING,
      SUCCESS_YOUTH_UNLOCK_NOTE,
      SUCCESS_YOUTH_VENMO_MATCH,
    ].join(" ");
    assert.match(text, /RowRide/);
    assert.match(text, /do not need a team or boat name/);
    assert.equal(/household/i.test(text), false);
    assert.equal(/your team name/i.test(text), false);
    assert.equal(/enter a (team|boat) name/i.test(text), false);
    assert.equal(SUCCESS_YOUTH_SUMMARY_HEADING, "RowRide summary");
    assert.match(SUCCESS_YOUTH_VENMO_MATCH, /RowRide entry/);
  });
});
