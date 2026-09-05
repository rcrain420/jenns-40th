import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FEE_PER_ANGLER_CENTS } from "./config.ts";
import { boatContactNotAnglerNudge } from "./boat-contact-copy.ts";
import { formatUsdWhole } from "./money.ts";

describe("boat contact nudge", () => {
  it("tells the registrant they are not a $75 seat unless they add themselves", () => {
    const text = boatContactNotAnglerNudge(formatUsdWhole(FEE_PER_ANGLER_CENTS));
    assert.match(text, /boat contact/i);
    assert.match(text, /add yourself as an angler/i);
    assert.match(text, /\$75/);
    assert.equal(/\$0/.test(text), false);
  });
});
