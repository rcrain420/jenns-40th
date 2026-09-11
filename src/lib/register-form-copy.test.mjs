import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BOAT_ENTRY_CENTS, MAX_ANGLERS, MIN_ANGLERS } from "./config.ts";
import { anglersSectionHelp } from "./register-form-copy.ts";

describe("anglersSectionHelp", () => {
  it("keeps the adult-only boat roster, invite, and captain rules without the essay", () => {
    const fee = BOAT_ENTRY_CENTS / 100;
    const text = anglersSectionHelp({
      minAnglers: MIN_ANGLERS,
      maxAnglers: MAX_ANGLERS,
      feeDollars: fee,
    });

    assert.match(text, new RegExp(`${MIN_ANGLERS}–${MAX_ANGLERS}`));
    assert.match(text, /adult seats/);
    assert.match(text, /adults only/);
    assert.match(text, /One adult name/);
    assert.match(text, /My team/);
    assert.match(text, /shirt size/);
    assert.match(text, /email is optional/i);
    assert.match(text, /from land/);
    assert.match(text, /RowRide/);
    assert.match(text, /not added to this boat/);
    assert.match(text, new RegExp(`\\$${fee} boat entry`));
    assert.match(text, /Join the boat/);
    assert.match(text, /invite link/);
    assert.match(text, /Captain is optional/);
    assert.match(text, /18\+/);

    assert.equal(/17-or-under/i.test(text), false);
    assert.equal(/captain or guide/i.test(text), false);
    assert.equal(/\+ Add youth/i.test(text), false);
    assert.equal(/join a registered boat roster/i.test(text), false);
    assert.equal(/that is not the kids path/i.test(text), false);
    assert.equal(/still count on the team stringer/i.test(text), false);
    assert.equal(/kids included/i.test(text), false);
    assert.equal(/count toward the/i.test(text), false);
    assert.ok(text.split(/\s+/).length <= 130, text);
  });
});
