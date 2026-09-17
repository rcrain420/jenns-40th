import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ENTRY_KIND } from "./config.ts";
import {
  ALREADY_ON_ANOTHER_BOAT,
  boatMemberships,
  decideTeamMembership,
  pickDisplayTeamName,
  uniqueTeamIds,
  userOwnsTeam,
  youthLandMemberships,
} from "./team-membership.ts";

const YOUTH = {
  teamId: "youth_rowride",
  entryKind: ENTRY_KIND.YOUTH_LAND,
};
const BOAT_A = { teamId: "boat_reel_bad", entryKind: ENTRY_KIND.BOAT };
const BOAT_B = { teamId: "boat_other", entryKind: ENTRY_KIND.BOAT };

describe("youth then join boat (Jarah / RowRide parent)", () => {
  it("lets a YOUTH_LAND parent join a boat without replacing the youth membership", () => {
    const youthOnly = decideTeamMembership({
      existing: [YOUTH],
      target: BOAT_A,
    });
    assert.deepEqual(youthOnly, { ok: true, already: false });

    const both = decideTeamMembership({
      existing: [YOUTH, BOAT_A],
      target: YOUTH,
    });
    assert.deepEqual(both, { ok: true, already: true });
  });

  it("keeps youth claim compatible with an existing boat membership", () => {
    const addYouth = decideTeamMembership({
      existing: [BOAT_A],
      target: YOUTH,
    });
    assert.deepEqual(addYouth, { ok: true, already: false });
  });
});

describe("boat then register youth", () => {
  it("does not treat a boat membership as blocking RowRide", () => {
    assert.deepEqual(
      decideTeamMembership({
        existing: [BOAT_A],
        target: { teamId: "youth_second", entryKind: ENTRY_KIND.YOUTH_LAND },
      }),
      { ok: true, already: false },
    );
  });

  it("allows more than one YOUTH_LAND entry the parent owns", () => {
    assert.deepEqual(
      decideTeamMembership({
        existing: [BOAT_A, YOUTH],
        target: { teamId: "youth_cousins", entryKind: ENTRY_KIND.YOUTH_LAND },
      }),
      { ok: true, already: false },
    );
  });
});

describe("still block two boats", () => {
  it("rejects joining a different boat", () => {
    const blocked = decideTeamMembership({
      existing: [BOAT_A],
      target: BOAT_B,
    });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.reason, "other-boat");
      assert.equal(blocked.error, ALREADY_ON_ANOTHER_BOAT);
    }
  });

  it("rejects a second boat even when the user also has RowRide kids", () => {
    const blocked = decideTeamMembership({
      existing: [YOUTH, BOAT_A],
      target: BOAT_B,
    });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.reason, "other-boat");
  });

  it("is a no-op when they re-join the boat they are already on", () => {
    assert.deepEqual(
      decideTeamMembership({
        existing: [YOUTH, BOAT_A],
        target: BOAT_A,
      }),
      { ok: true, already: true },
    );
  });
});

describe("membership helpers", () => {
  it("splits boat vs RowRide and prefers the boat name for display", () => {
    const rows = [YOUTH, BOAT_A];
    assert.deepEqual(boatMemberships(rows), [BOAT_A]);
    assert.deepEqual(youthLandMemberships(rows), [YOUTH]);
    assert.equal(
      pickDisplayTeamName([
        { teamName: "RowRide — Rowan", entryKind: ENTRY_KIND.YOUTH_LAND },
        { teamName: "Reel Bad Decisions", entryKind: ENTRY_KIND.BOAT },
      ]),
      "Reel Bad Decisions",
    );
    assert.equal(
      pickDisplayTeamName([
        { teamName: "RowRide — Rowan", entryKind: ENTRY_KIND.YOUTH_LAND },
      ]),
      "RowRide — Rowan",
    );
    assert.deepEqual(uniqueTeamIds(["a", "b", "a", null, ""]), ["a", "b"]);
  });

  it("treats claimer or matching registrant email as owner", () => {
    assert.equal(
      userOwnsTeam({
        userId: "u1",
        claimedByUserId: "u1",
        registrantEmail: "other@example.com",
        userEmail: "parent@example.com",
      }),
      true,
    );
    assert.equal(
      userOwnsTeam({
        userId: "u1",
        claimedByUserId: "someone-else",
        registrantEmail: "Parent@example.com",
        userEmail: "parent@example.com",
      }),
      true,
    );
    assert.equal(
      userOwnsTeam({
        userId: "u1",
        claimedByUserId: "someone-else",
        registrantEmail: "other@example.com",
        userEmail: "parent@example.com",
      }),
      false,
    );
  });
});
