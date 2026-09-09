import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BOAT_ENTRY_CENTS, mainPotCentsForTeams } from "./config.ts";

describe("main pot", () => {
  it("grows by boats × $300, not adult seats", () => {
    assert.equal(mainPotCentsForTeams(0), 0);
    assert.equal(mainPotCentsForTeams(1), BOAT_ENTRY_CENTS);
    assert.equal(mainPotCentsForTeams(3), 90000);
  });
});
