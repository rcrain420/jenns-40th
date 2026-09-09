import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_ANGLERS, MAX_YOUTH_ANGLERS, MIN_ANGLERS } from "./config.ts";
import {
  adultSeatCount,
  boatRosterCapacityIssue,
  canAddAdultSeat,
  canAddYouthSeat,
  namedSeatCount,
  youthLandRosterCapacityIssue,
  youthSeatCount,
} from "./roster-capacity.ts";

describe("boat vs youth seat capacity", () => {
  it("counts youth toward the 1–4 boat roster", () => {
    const roster = [
      { isYouth: false },
      { isYouth: false },
      { isYouth: false },
      { isYouth: true },
    ];
    assert.equal(adultSeatCount(roster), 3);
    assert.equal(youthSeatCount(roster), 1);
    assert.equal(namedSeatCount(roster), MAX_ANGLERS);
    assert.equal(boatRosterCapacityIssue(roster), null);
    assert.equal(canAddAdultSeat(roster), false);
    assert.equal(canAddYouthSeat(roster), false);
  });

  it("treats 2 adults + 2 youth as a full boat", () => {
    const roster = [
      { isYouth: false },
      { isYouth: false },
      { isYouth: true },
      { isYouth: true },
    ];
    assert.equal(namedSeatCount(roster), MAX_ANGLERS);
    assert.equal(boatRosterCapacityIssue(roster), null);
    assert.equal(canAddAdultSeat(roster), false);
    assert.equal(canAddYouthSeat(roster), false);
  });

  it("rejects a fifth seat when 4 adults plus a youth would exceed the cap", () => {
    const roster = [
      { isYouth: false },
      { isYouth: false },
      { isYouth: false },
      { isYouth: false },
      { isYouth: true },
    ];
    assert.equal(adultSeatCount(roster), MAX_ANGLERS);
    assert.match(boatRosterCapacityIssue(roster) ?? "", /including youth/i);
    assert.equal(canAddAdultSeat(roster), false);
    assert.equal(canAddYouthSeat(roster), false);
  });

  it("rejects a boat with only youth", () => {
    const issue = boatRosterCapacityIssue([{ isYouth: true }]);
    assert.match(issue ?? "", /at least 1 adult/i);
    assert.match(issue ?? "", /from land/i);
    assert.equal(MIN_ANGLERS, 1);
  });

  it("rejects a fifth adult", () => {
    const roster = Array.from({ length: 5 }, () => ({ isYouth: false }));
    assert.match(boatRosterCapacityIssue(roster) ?? "", /at most 4/i);
    assert.match(boatRosterCapacityIssue(roster) ?? "", /including youth/i);
  });

  it("keeps land-only RowRide at 1–8 youth, not the boat cap", () => {
    assert.equal(
      youthLandRosterCapacityIssue([{ isYouth: true }, { isYouth: true }]),
      null,
    );
    assert.match(
      youthLandRosterCapacityIssue([{ isYouth: false }]) ?? "",
      /youth only/i,
    );
    const fiveLand = Array.from({ length: 5 }, () => ({ isYouth: true }));
    assert.equal(youthLandRosterCapacityIssue(fiveLand), null);
    assert.equal(canAddYouthSeat(fiveLand, "YOUTH_LAND"), true);
    const tooMany = Array.from({ length: MAX_YOUTH_ANGLERS + 1 }, () => ({
      isYouth: true,
    }));
    assert.match(youthLandRosterCapacityIssue(tooMany) ?? "", /at most 8/i);
    assert.equal(canAddYouthSeat(tooMany.slice(0, MAX_YOUTH_ANGLERS), "YOUTH_LAND"), false);
  });
});
