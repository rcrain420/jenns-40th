import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SUCCESS_CREATOR_ACCESS_NOTE,
  SUCCESS_UNLOCK_NOTE,
  SUCCESS_VENMO_BANNER,
  SUCCESS_VENMO_NOTE,
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
});
