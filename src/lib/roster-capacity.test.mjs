import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_ANGLERS, MAX_YOUTH_ANGLERS, MIN_ANGLERS } from "./config.ts";
import {
  BOAT_YOUTH_FORBIDDEN_ERROR,
  adultSeatCount,
  boatRosterCapacityIssue,
  boatYouthForbiddenIssue,
  canAddAdultSeat,
  canAddYouthSeat,
  namedSeatCount,
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
    assert.equal(namedSeatCount(roster), 4);
    assert.equal(boatRosterCapacityIssue(roster), null);
    assert.equal(canAddAdultSeat(roster), true);
    assert.equal(canAddYouthSeat(roster), false);
    assert.equal(boatYouthForbiddenIssue(roster), BOAT_YOUTH_FORBIDDEN_ERROR);
  });

  it("allows leftover youth on a boat for adult-cap math only", () => {
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
    assert.equal(canAddYouthSeat(roster), false);
    assert.equal(boatYouthForbiddenIssue(roster), BOAT_YOUTH_FORBIDDEN_ERROR);
  });

  it("treats 3 adults + 1 youth as not full for a fourth adult", () => {
    const roster = [
      { isYouth: false },
      { isYouth: false },
      { isYouth: false },
      { isYouth: true },
    ];
    assert.equal(canAddAdultSeat(roster), true);
    assert.equal(boatRosterCapacityIssue(roster), null);
  });

  it("rejects a boat with only youth", () => {
    const issue = boatRosterCapacityIssue([{ isYouth: true }]);
    assert.match(issue ?? "", /at least 1 adult/i);
    assert.match(issue ?? "", /RowRide/i);
    assert.equal(MIN_ANGLERS, 1);
  });

  it("rejects a fifth adult", () => {
    const roster = Array.from({ length: 5 }, () => ({ isYouth: false }));
    assert.match(boatRosterCapacityIssue(roster) ?? "", /at most 4 adult/i);
    assert.match(boatRosterCapacityIssue(roster) ?? "", /do not count toward that cap/i);
  });

  it("forbids adding youth on a boat and still caps leftover youth at 8", () => {
    const adultsOnly = Array.from({ length: 2 }, () => ({ isYouth: false }));
    assert.equal(canAddYouthSeat(adultsOnly), false);
    assert.equal(boatYouthForbiddenIssue(adultsOnly), null);

    const fourAdults = Array.from({ length: 4 }, () => ({ isYouth: false }));
    const eightYouth = Array.from({ length: MAX_YOUTH_ANGLERS }, () => ({
      isYouth: true,
    }));
    const atMax = [...fourAdults, ...eightYouth];
    assert.equal(boatRosterCapacityIssue(atMax), null);
    assert.equal(canAddYouthSeat(atMax), false);
    assert.match(
      boatRosterCapacityIssue([...atMax, { isYouth: true }]) ?? "",
      /at most 8/i,
    );
  });

  it("keeps land-only RowRide at 1–8 youth, not the adult boat cap", () => {
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
    assert.equal(
      canAddYouthSeat(tooMany.slice(0, MAX_YOUTH_ANGLERS), "YOUTH_LAND"),
      false,
    );
  });
});
