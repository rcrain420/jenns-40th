import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BOAT_ENTRY_CENTS, MAX_ANGLERS, MIN_ANGLERS } from "./config.ts";
import { anglersSectionHelp } from "./register-form-copy.ts";

describe("anglersSectionHelp", () => {
  it("keeps the roster, youth, invite, and captain rules without the essay", () => {
    const fee = BOAT_ENTRY_CENTS / 100;
    const text = anglersSectionHelp({
      minAnglers: MIN_ANGLERS,
      maxAnglers: MAX_ANGLERS,
      feeDollars: fee,
    });

    assert.match(text, new RegExp(`${MIN_ANGLERS}–${MAX_ANGLERS}`));
    assert.match(text, /kids included/);
    assert.match(text, /count toward/);
    assert.match(text, /One adult name/);
    assert.match(text, /My team/);
    assert.match(text, /17-or-under/);
    assert.match(text, /shirt size/);
    assert.match(text, /email is optional/i);
    assert.match(text, /from land/);
    assert.match(text, new RegExp(`\\$${fee} boat entry`));
    assert.match(text, /create-account invite/);
    assert.match(text, /parent/);
    assert.match(text, /Join the boat/);
    assert.match(text, /invite link/);
    assert.match(text, /Captain is optional/);
    assert.match(text, /18\+/);
    assert.match(text, /out of the main stringer/);
    assert.match(text, /paid side pots and RowRide/);

    assert.equal(/that is not the kids path/i.test(text), false);
    assert.equal(/still count on the team stringer/i.test(text), false);
    assert.equal(/kids do not take one/i.test(text), false);
    assert.equal(/adult seats/i.test(text), false);
    assert.ok(text.split(/\s+/).length <= 120, text);
  });
});
