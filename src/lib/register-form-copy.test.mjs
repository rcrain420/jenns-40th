import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FEE_PER_ANGLER_CENTS, MAX_ANGLERS, MIN_ANGLERS } from "./config.ts";
import { anglersSectionHelp } from "./register-form-copy.ts";

describe("anglersSectionHelp", () => {
  it("keeps the roster, youth, invite, and captain rules without the essay", () => {
    const fee = FEE_PER_ANGLER_CENTS / 100;
    const text = anglersSectionHelp({
      minAnglers: MIN_ANGLERS,
      maxAnglers: MAX_ANGLERS,
      feeDollars: fee,
    });

    assert.match(text, new RegExp(`${MIN_ANGLERS}–${MAX_ANGLERS}`));
    assert.match(text, /kids included/);
    assert.match(text, /two names/);
    assert.match(text, /My team/);
    assert.match(text, /17-or-under/);
    assert.match(text, /email is optional/i);
    assert.match(text, new RegExp(`no \\$${fee}`));
    assert.match(text, /create-account invite/);
    assert.match(text, /parent/);
    assert.match(text, /Join the boat/);
    assert.match(text, /invite link/);
    assert.match(text, /Captain is optional/);
    assert.match(text, /18\+/);

    assert.equal(/that is not the kids path/i.test(text), false);
    assert.ok(text.split(/\s+/).length <= 90, text);
  });
});
