import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BOAT_ENTRY_CENTS,
  countSidePotEntrants,
  mainPotCentsForTeams,
} from "./config.ts";

describe("main pot", () => {
  it("grows by boats × $300, not adult seats", () => {
    assert.equal(mainPotCentsForTeams(0), 0);
    assert.equal(mainPotCentsForTeams(1), BOAT_ENTRY_CENTS);
    assert.equal(mainPotCentsForTeams(3), 90000);
  });
});

describe("side pot entrants", () => {
  it("counts boat teams and RowRide entries that bought the pot", () => {
    const teams = [
      { sidePots: ["trout", "blackjack"] },
      { sidePots: ["trout"] },
      { sidePots: [] },
    ];
    assert.equal(countSidePotEntrants(teams, "trout"), 2);
    assert.equal(countSidePotEntrants(teams, "blackjack"), 1);
    assert.equal(countSidePotEntrants(teams, "spots"), 0);
  });
});
