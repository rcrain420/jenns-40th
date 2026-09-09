import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_ANGLERS, MAX_YOUTH_ANGLERS, MIN_ANGLERS } from "./config.ts";
import {
  adultSeatCount,
  boatRosterCapacityIssue,
  canAddAdultSeat,
  canAddYouthSeat,
  youthLandRosterCapacityIssue,
  youthSeatCount,
} from "./roster-capacity.ts";

describe("boat vs youth seat capacity", () => {
  it("does not count youth toward the 1–4 adult boat cap", () => {
    const roster = [
      { isYouth: false },
      { isYouth: false },
      { isYouth: false },
      { isYouth: true },
    ];
    assert.equal(adultSeatCount(roster), 3);
    assert.equal(youthSeatCount(roster), 1);
    assert.equal(boatRosterCapacityIssue(roster), null);
    assert.equal(canAddAdultSeat(roster), true);
    assert.equal(canAddYouthSeat(roster), true);
  });

  it("allows 4 adults plus youth without exceeding the boat cap", () => {
    const roster = [
      { isYouth: false },
      { isYouth: false },
      { isYouth: false },
      { isYouth: false },
      { isYouth: true },
    ];
    assert.equal(adultSeatCount(roster), MAX_ANGLERS);
    assert.equal(boatRosterCapacityIssue(roster), null);
    assert.equal(canAddAdultSeat(roster), false);
    assert.equal(canAddYouthSeat(roster), true);
  });

  it("rejects a boat with only youth", () => {
    const issue = boatRosterCapacityIssue([{ isYouth: true }]);
    assert.match(issue ?? "", /at least 1 adult/i);
    assert.match(issue ?? "", /from land/i);
    assert.equal(MIN_ANGLERS, 1);
  });

  it("rejects a fifth adult", () => {
    const roster = Array.from({ length: 5 }, () => ({ isYouth: false }));
    assert.match(boatRosterCapacityIssue(roster) ?? "", /at most 4 adult/i);
  });

  it("treats land-only entries as youth-only RowRide", () => {
    assert.equal(
      youthLandRosterCapacityIssue([{ isYouth: true }, { isYouth: true }]),
      null,
    );
    assert.match(
      youthLandRosterCapacityIssue([{ isYouth: false }]) ?? "",
      /youth only/i,
    );
    const tooMany = Array.from({ length: MAX_YOUTH_ANGLERS + 1 }, () => ({
      isYouth: true,
    }));
    assert.match(youthLandRosterCapacityIssue(tooMany) ?? "", /at most 8/i);
  });
});
