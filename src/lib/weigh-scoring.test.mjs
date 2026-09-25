import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSidePotStandings, buildWeighInStandings } from "./weigh-board.ts";
import {
  announceBoardPlace,
  blackjackLengthEligible,
  canEnterMainStringer,
  evaluateSidePot,
  qualifyingStringerTotal,
  rankMainStringers,
  rankSidePot,
  teamBoughtSidePot,
  troutLengthEligible,
  validateStringerAssignment,
} from "./weigh-scoring.ts";

const trout = (overrides = {}) => ({
  id: "t",
  species: "TROUT",
  weightLbs: 4,
  lengthInches: 18,
  spotCount: null,
  disqualified: false,
  taggedTrout: false,
  weighedAt: "2026-10-10T17:30:00.000Z",
  sequence: 1,
  ...overrides,
});

const redfish = (overrides = {}) => ({
  id: "r",
  species: "REDFISH",
  weightLbs: 6,
  lengthInches: 20,
  spotCount: 3,
  disqualified: false,
  taggedTrout: false,
  weighedAt: "2026-10-10T17:40:00.000Z",
  sequence: 2,
  ...overrides,
});

describe("trout window", () => {
  it("accepts 15 through 20 and rejects 14.9 and 20.1", () => {
    assert.equal(troutLengthEligible(14.9), false);
    assert.equal(troutLengthEligible(15), true);
    assert.equal(troutLengthEligible(20), true);
    assert.equal(troutLengthEligible(20.1), false);
    assert.equal(troutLengthEligible(null), false);
  });

  it("marks tagged and out-of-slot trout ineligible for the side pot", () => {
    const bought = ["trout"];
    assert.equal(evaluateSidePot("trout", trout({ lengthInches: 14.9 }), bought).eligible, false);
    assert.equal(evaluateSidePot("trout", trout({ lengthInches: 20.1 }), bought).eligible, false);
    assert.equal(evaluateSidePot("trout", trout({ lengthInches: 15 }), bought).eligible, true);
    assert.equal(evaluateSidePot("trout", trout({ lengthInches: 20 }), bought).eligible, true);
    const tagged = evaluateSidePot("trout", trout({ taggedTrout: true }), bought);
    assert.equal(tagged.eligible, false);
    assert.match(tagged.reason, /Tagged/);
  });

  it("breaks a weight tie by first weighed", () => {
    const ranked = rankSidePot("trout", [
      {
        teamId: "late",
        teamName: "Late",
        eligible: true,
        weightLbs: 5,
        lengthInches: 18,
        spotCount: null,
        weighedAt: "2026-10-10T18:00:00.000Z",
        sequence: 2,
      },
      {
        teamId: "early",
        teamName: "Early",
        eligible: true,
        weightLbs: 5,
        lengthInches: 16,
        spotCount: null,
        weighedAt: "2026-10-10T17:00:00.000Z",
        sequence: 1,
      },
      {
        teamId: "heavy",
        teamName: "Heavy",
        eligible: true,
        weightLbs: 5.1,
        lengthInches: 19,
        spotCount: null,
        weighedAt: "2026-10-10T18:30:00.000Z",
        sequence: 3,
      },
    ]);
    assert.deepEqual(
      ranked.map((row) => row.teamId),
      ["heavy", "early", "late"],
    );
  });
});

describe("blackjack", () => {
  it("treats 21.0 as legal and 21.1 as over", () => {
    assert.equal(blackjackLengthEligible(21), true);
    assert.equal(blackjackLengthEligible(21.0), true);
    assert.equal(blackjackLengthEligible(21.1), false);
    assert.equal(evaluateSidePot("blackjack", redfish({ lengthInches: 21 }), ["blackjack"]).eligible, true);
    const over = evaluateSidePot("blackjack", redfish({ lengthInches: 21.1 }), ["blackjack"]);
    assert.equal(over.eligible, false);
    assert.match(over.reason, /Over 21/);
  });

  it("ranks closest to 21, then heavier, then first weighed", () => {
    const ranked = rankSidePot("blackjack", [
      {
        teamId: "short",
        teamName: "Short",
        eligible: true,
        weightLbs: 9,
        lengthInches: 19,
        spotCount: 1,
        weighedAt: "2026-10-10T17:00:00.000Z",
        sequence: 1,
      },
      {
        teamId: "light",
        teamName: "Light",
        eligible: true,
        weightLbs: 5,
        lengthInches: 20.5,
        spotCount: 1,
        weighedAt: "2026-10-10T17:10:00.000Z",
        sequence: 2,
      },
      {
        teamId: "heavy-late",
        teamName: "Heavy late",
        eligible: true,
        weightLbs: 8,
        lengthInches: 20.5,
        spotCount: 1,
        weighedAt: "2026-10-10T17:20:00.000Z",
        sequence: 3,
      },
      {
        teamId: "exact",
        teamName: "Exact",
        eligible: true,
        weightLbs: 4,
        lengthInches: 21,
        spotCount: 1,
        weighedAt: "2026-10-10T18:00:00.000Z",
        sequence: 4,
      },
      {
        teamId: "over",
        teamName: "Over",
        eligible: false,
        weightLbs: 12,
        lengthInches: 21.1,
        spotCount: 1,
        weighedAt: "2026-10-10T17:01:00.000Z",
        sequence: 5,
      },
    ]);
    assert.deepEqual(
      ranked.map((row) => row.teamId),
      ["exact", "heavy-late", "light", "short"],
    );
  });

  it("uses first weighed when length and weight match", () => {
    const ranked = rankSidePot("blackjack", [
      {
        teamId: "second",
        teamName: "Second",
        eligible: true,
        weightLbs: 7,
        lengthInches: 20,
        spotCount: 2,
        weighedAt: "2026-10-10T18:00:00.000Z",
        sequence: 8,
      },
      {
        teamId: "first",
        teamName: "First",
        eligible: true,
        weightLbs: 7,
        lengthInches: 20,
        spotCount: 4,
        weighedAt: "2026-10-10T17:05:00.000Z",
        sequence: 2,
      },
    ]);
    assert.equal(ranked[0].teamId, "first");
    assert.equal(ranked[0].place, 1);
  });
});

describe("spots", () => {
  it("ranks by count, then weight, then first weighed", () => {
    const ranked = rankSidePot("spots", [
      {
        teamId: "few",
        teamName: "Few",
        eligible: true,
        weightLbs: 10,
        lengthInches: 24,
        spotCount: 2,
        weighedAt: "2026-10-10T17:00:00.000Z",
        sequence: 1,
      },
      {
        teamId: "light",
        teamName: "Light",
        eligible: true,
        weightLbs: 4,
        lengthInches: 22,
        spotCount: 5,
        weighedAt: "2026-10-10T17:15:00.000Z",
        sequence: 2,
      },
      {
        teamId: "heavy-late",
        teamName: "Heavy late",
        eligible: true,
        weightLbs: 7,
        lengthInches: 23,
        spotCount: 5,
        weighedAt: "2026-10-10T17:30:00.000Z",
        sequence: 3,
      },
      {
        teamId: "heavy-early",
        teamName: "Heavy early",
        eligible: true,
        weightLbs: 7,
        lengthInches: 23,
        spotCount: 5,
        weighedAt: "2026-10-10T17:10:00.000Z",
        sequence: 4,
      },
    ]);
    assert.deepEqual(
      ranked.map((row) => row.teamId),
      ["heavy-early", "heavy-late", "light", "few"],
    );
  });

  it("requires a spot count", () => {
    const missing = evaluateSidePot(
      "spots",
      redfish({ spotCount: null }),
      ["spots"],
    );
    assert.equal(missing.eligible, false);
    assert.match(missing.reason, /Spot count/);
    assert.equal(evaluateSidePot("spots", redfish({ spotCount: 0 }), ["spots"]).eligible, true);
  });
});

describe("main stringer", () => {
  it("sums a partial stringer and skips a later DQ fish", () => {
    const partial = qualifyingStringerTotal({
      trout: trout({ weightLbs: 2.5 }),
      redfish: [redfish({ weightLbs: 3 }), null, null],
    });
    assert.equal(partial.totalWeightLbs, 5.5);
    assert.equal(partial.qualifyingCount, 2);

    const withDq = qualifyingStringerTotal({
      trout: trout({ weightLbs: 2, disqualified: true }),
      redfish: [redfish({ weightLbs: 4.25 })],
    });
    assert.equal(withDq.totalWeightLbs, 4.25);
    assert.equal(withDq.qualifyingCount, 1);
    assert.equal(withDq.firstSequence, 2);
  });

  it("blocks a fourth redfish, a tagged trout, and an empty lock", () => {
    const tooMany = validateStringerAssignment({
      trout: null,
      redfish: [
        redfish({ id: "a" }),
        redfish({ id: "b" }),
        redfish({ id: "c" }),
        redfish({ id: "d" }),
      ],
    });
    assert.equal(tooMany.ok, false);

    const tagged = validateStringerAssignment({
      trout: trout({ taggedTrout: true }),
      redfish: [],
    });
    assert.equal(tagged.ok, false);
    assert.match(tagged.error, /Tagged/);

    const empty = validateStringerAssignment({
      trout: null,
      redfish: [null, null, null],
      forLock: true,
    });
    assert.equal(empty.ok, false);
    assert.match(empty.error, /at least one/);
  });

  it("ranks heavier totals, then the first weighed stringer", () => {
    const ranked = rankMainStringers([
      {
        teamId: "light",
        teamName: "Light",
        entryKind: "BOAT",
        status: "LOCKED",
        totalWeightLbs: 8,
        lockedAt: "2026-10-10T17:00:00.000Z",
        firstWeighedAt: "2026-10-10T17:00:00.000Z",
        firstSequence: 1,
      },
      {
        teamId: "late",
        teamName: "Late tie",
        entryKind: "BOAT",
        status: "LOCKED",
        totalWeightLbs: 10,
        lockedAt: "2026-10-10T18:00:00.000Z",
        firstWeighedAt: "2026-10-10T18:00:00.000Z",
        firstSequence: 4,
      },
      {
        teamId: "early",
        teamName: "Early tie",
        entryKind: "BOAT",
        status: "LOCKED",
        totalWeightLbs: 10,
        lockedAt: "2026-10-10T17:30:00.000Z",
        firstWeighedAt: "2026-10-10T17:20:00.000Z",
        firstSequence: 2,
      },
      {
        teamId: "draft",
        teamName: "Still drafting",
        entryKind: "BOAT",
        status: "DRAFT",
        totalWeightLbs: 40,
        lockedAt: null,
        firstWeighedAt: "2026-10-10T17:01:00.000Z",
        firstSequence: 1,
      },
      {
        teamId: "kid",
        teamName: "RowRide",
        entryKind: "YOUTH_LAND",
        status: "LOCKED",
        totalWeightLbs: 50,
        lockedAt: "2026-10-10T17:05:00.000Z",
        firstWeighedAt: "2026-10-10T17:05:00.000Z",
        firstSequence: 1,
      },
    ]);
    assert.deepEqual(
      ranked.map((row) => row.teamId),
      ["early", "late", "light"],
    );
    assert.equal(ranked[0].rank, 1);
  });

  it("keeps youth off the main board and only ranks locked boats", () => {
    assert.equal(canEnterMainStringer("BOAT"), true);
    assert.equal(canEnterMainStringer("YOUTH_LAND"), false);
    assert.equal(teamBoughtSidePot(["trout", "spots"], "spots"), true);
    assert.equal(teamBoughtSidePot(["trout"], "blackjack"), false);
    assert.equal(teamBoughtSidePot(["blackjack"], "blackjack"), true);
  });
});

describe("standings boards", () => {
  const session = {
    id: "sess",
    label: "2026-10-10 main",
    status: "OPEN",
    updatedAt: "2026-10-10T18:00:00.000Z",
    startsAt: null,
    endsAt: null,
  };

  it("shows hero delta, boats remaining, and on-the-scale drafts", () => {
    const board = buildWeighInStandings({
      session,
      teams: [
        { id: "a", teamName: "Alpha", entryKind: "BOAT", sidePots: ["trout"] },
        { id: "b", teamName: "Bravo", entryKind: "BOAT", sidePots: [] },
        { id: "c", teamName: "Charlie", entryKind: "BOAT", sidePots: [] },
        { id: "d", teamName: "Delta", entryKind: "BOAT", sidePots: [] },
        { id: "y", teamName: "Kid Boat", entryKind: "YOUTH_LAND", sidePots: ["trout"] },
      ],
      fish: [
        {
          id: "af",
          teamId: "a",
          species: "REDFISH",
          weightLbs: 8,
          lengthInches: 22,
          spotCount: 1,
          weighedAt: "2026-10-10T17:10:00.000Z",
          sequence: 1,
          disqualified: false,
          taggedTrout: false,
        },
        {
          id: "bf",
          teamId: "b",
          species: "REDFISH",
          weightLbs: 5,
          lengthInches: 21,
          spotCount: 2,
          weighedAt: "2026-10-10T17:20:00.000Z",
          sequence: 2,
          disqualified: false,
          taggedTrout: false,
        },
        {
          id: "cf",
          teamId: "c",
          species: "TROUT",
          weightLbs: 3,
          lengthInches: 16,
          spotCount: null,
          weighedAt: "2026-10-10T17:40:00.000Z",
          sequence: 3,
          disqualified: false,
          taggedTrout: false,
        },
      ],
      stringers: [
        {
          teamId: "a",
          status: "LOCKED",
          troutFishId: null,
          redfish: [{ slot: 1, weighedFishId: "af" }],
          totalWeightLbs: 8,
          lockedAt: "2026-10-10T17:15:00.000Z",
          dqReason: null,
        },
        {
          teamId: "b",
          status: "LOCKED",
          troutFishId: null,
          redfish: [{ slot: 1, weighedFishId: "bf" }],
          totalWeightLbs: 5,
          lockedAt: "2026-10-10T17:25:00.000Z",
          dqReason: null,
        },
        {
          teamId: "c",
          status: "DRAFT",
          troutFishId: "cf",
          redfish: [],
          totalWeightLbs: 3,
          lockedAt: null,
          dqReason: null,
        },
        {
          teamId: "y",
          status: "LOCKED",
          troutFishId: null,
          redfish: [],
          totalWeightLbs: 99,
          lockedAt: "2026-10-10T17:01:00.000Z",
          dqReason: null,
        },
      ],
    });

    assert.equal(board.hero.teamName, "Alpha");
    assert.equal(board.hero.deltaLbs, 3);
    assert.deepEqual(
      board.ranks.map((row) => row.teamName),
      ["Alpha", "Bravo"],
    );
    assert.deepEqual(board.onTheScale, ["Charlie"]);
    assert.deepEqual(board.boatsRemaining, ["Delta"]);
    assert.equal(board.ranks[0].redfishLbs[0], 8);
    assert.equal(board.ranks[0].redfishLbs[1], null);
  });

  it("does not put an ineligible or unpaid pot fish on the side-pot board", () => {
    const board = buildSidePotStandings({
      session,
      teams: [
        { id: "in", teamName: "Bought", entryKind: "BOAT", sidePots: ["blackjack"] },
        { id: "out", teamName: "Did not buy", entryKind: "BOAT", sidePots: [] },
        { id: "kid", teamName: "RowRide", entryKind: "YOUTH_LAND", sidePots: ["trout"] },
      ],
      fish: [
        {
          id: "ok",
          teamId: "in",
          species: "REDFISH",
          weightLbs: 6,
          lengthInches: 20.25,
          spotCount: 2,
          weighedAt: "2026-10-10T17:00:00.000Z",
          sequence: 1,
          disqualified: false,
          taggedTrout: false,
        },
        {
          id: "over",
          teamId: "out",
          species: "REDFISH",
          weightLbs: 9,
          lengthInches: 20.9,
          spotCount: 8,
          weighedAt: "2026-10-10T17:05:00.000Z",
          sequence: 2,
          disqualified: false,
          taggedTrout: false,
        },
        {
          id: "yt",
          teamId: "kid",
          species: "TROUT",
          weightLbs: 3.5,
          lengthInches: 17,
          spotCount: null,
          weighedAt: "2026-10-10T17:06:00.000Z",
          sequence: 3,
          disqualified: false,
          taggedTrout: false,
        },
      ],
      entries: [
        { potId: "blackjack", teamId: "in", weighedFishId: "ok" },
        { potId: "blackjack", teamId: "out", weighedFishId: "over" },
        { potId: "trout", teamId: "kid", weighedFishId: "yt" },
      ],
      pools: [
        { id: "trout", totalCents: 5000, entrantCount: 1 },
        { id: "blackjack", totalCents: 5000, entrantCount: 1 },
        { id: "spots", totalCents: 0, entrantCount: 0 },
      ],
    });
    const blackjack = board.pots.find((pot) => pot.id === "blackjack");
    const troutPot = board.pots.find((pot) => pot.id === "trout");
    assert.deepEqual(
      blackjack.leaders.map((row) => row.teamName),
      ["Bought"],
    );
    assert.equal(blackjack.leaders[0].distanceUnder21, 0.75);
    assert.deepEqual(
      troutPot.leaders.map((row) => row.teamName),
      ["RowRide"],
    );
    assert.equal(announceBoardPlace(2, 12.4, true), "#2 on the board — 12.40 lb");
    assert.match(announceBoardPlace(null, 4, false), /Lock the stringer/);
  });
});
