import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSidePotStandings, buildWeighInStandings, slotWeightText } from "./weigh-board.ts";
import {
  announceBoardPlace,
  blackjackLengthEligible,
  canEnterMainStringer,
  evaluateSidePot,
  formatWeightLbs,
  formatWeightLbsOz,
  lbsOzFromWeightLbs,
  parseScaleWeight,
  qualifyingStringerTotal,
  rankMainStringers,
  rankSidePot,
  teamBoughtSidePot,
  troutLengthEligible,
  validateStringerAssignment,
  weightLbsFromLbsOz,
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
    assert.equal(board.ranks[0].redfishInches[0], 22);
    assert.equal(board.ranks[0].redfishSpots[0], 1);
    assert.equal(board.ranks[0].redfishInches[1], null);
    assert.equal(board.ranks[0].redfishSpots[1], null);
    assert.equal(board.ranks[0].troutInches, null);
    assert.equal(board.ranks[1].redfishInches[0], 21);
    assert.equal(board.ranks[1].redfishSpots[0], 2);
  });

  it("returns a cleared boat to still to weigh while its fish stay in the session", () => {
    const board = buildWeighInStandings({
      session,
      teams: [
        { id: "e", teamName: "Echo", entryKind: "BOAT", sidePots: [] },
        { id: "a", teamName: "Alpha", entryKind: "BOAT", sidePots: [] },
      ],
      fish: [
        {
          id: "ef",
          teamId: "e",
          species: "REDFISH",
          weightLbs: 7,
          lengthInches: 24,
          spotCount: 3,
          weighedAt: "2026-10-10T17:12:00.000Z",
          sequence: 1,
          disqualified: false,
          taggedTrout: false,
        },
        {
          id: "af",
          teamId: "a",
          species: "REDFISH",
          weightLbs: 6,
          lengthInches: 22,
          spotCount: 1,
          weighedAt: "2026-10-10T17:20:00.000Z",
          sequence: 2,
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
          totalWeightLbs: 6,
          lockedAt: "2026-10-10T17:21:00.000Z",
          dqReason: null,
        },
      ],
    });

    assert.deepEqual(
      board.ranks.map((row) => row.teamName),
      ["Alpha"],
    );
    assert.deepEqual(board.boatsRemaining, ["Echo"]);
    assert.deepEqual(board.onTheScale, []);
    assert.deepEqual(board.disqualified, []);
  });

  it("prints length on every weighed slot and spots only on redfish", () => {
    assert.equal(slotWeightText(12.06, false, 30, 2), "12.06 lb · 30 in · 2 spots");
    assert.equal(slotWeightText(4, false, 18, 1), "4.00 lb · 18 in · 1 spot");
    assert.equal(slotWeightText(2.5, false, 20), "2.50 lb · 20 in");
    assert.equal(slotWeightText(5, false, 19.5, 0), "5.00 lb · 19.5 in · 0 spots");
    assert.equal(slotWeightText(null, true, 20, 3), "DQ");
    assert.equal(slotWeightText(null, false), "—");
    assert.equal(slotWeightText(6, false, null, null), "6.00 lb");
  });

  it("keeps trout length off the spots field and hides a DQ redfish", () => {
    const board = buildWeighInStandings({
      session,
      teams: [{ id: "a", teamName: "Brahmas", entryKind: "BOAT", sidePots: [] }],
      fish: [
        {
          id: "t",
          teamId: "a",
          species: "TROUT",
          weightLbs: 12.06,
          lengthInches: 20,
          spotCount: 9,
          weighedAt: "2026-10-10T17:00:00.000Z",
          sequence: 1,
          disqualified: false,
          taggedTrout: false,
        },
        {
          id: "r",
          teamId: "a",
          species: "REDFISH",
          weightLbs: 8,
          lengthInches: 30,
          spotCount: 2,
          weighedAt: "2026-10-10T17:01:00.000Z",
          sequence: 2,
          disqualified: true,
          taggedTrout: false,
        },
        {
          id: "r2",
          teamId: "a",
          species: "REDFISH",
          weightLbs: 4.25,
          lengthInches: 18.5,
          spotCount: 1,
          weighedAt: "2026-10-10T17:02:00.000Z",
          sequence: 3,
          disqualified: false,
          taggedTrout: false,
        },
      ],
      stringers: [
        {
          teamId: "a",
          status: "LOCKED",
          troutFishId: "t",
          redfish: [
            { slot: 1, weighedFishId: "r" },
            { slot: 2, weighedFishId: "r2" },
          ],
          totalWeightLbs: 16.31,
          lockedAt: "2026-10-10T17:05:00.000Z",
          dqReason: null,
        },
      ],
    });
    const row = board.ranks[0];
    assert.equal(row.teamName, "Brahmas");
    assert.equal(row.troutLbs, 12.06);
    assert.equal(row.troutInches, 20);
    assert.equal(slotWeightText(row.troutLbs, row.troutDq, row.troutInches), "12.06 lb · 20 in");
    assert.equal(row.redfishDq[0], true);
    assert.equal(row.redfishSpots[0], null);
    assert.equal(
      slotWeightText(row.redfishLbs[0], row.redfishDq[0], row.redfishInches[0], row.redfishSpots[0]),
      "DQ",
    );
    assert.equal(
      slotWeightText(row.redfishLbs[1], row.redfishDq[1], row.redfishInches[1], row.redfishSpots[1]),
      "4.25 lb · 18.5 in · 1 spot",
    );
    assert.equal(row.totalWeightLbs, 16.31);
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

describe("scale pounds and ounces", () => {
  it("converts whole pounds and ounces to decimal pounds", () => {
    assert.equal(weightLbsFromLbsOz(5, 8), 5.5);
    assert.equal(weightLbsFromLbsOz(5, 0), 5);
    assert.equal(weightLbsFromLbsOz(0, 8), 0.5);
    assert.equal(weightLbsFromLbsOz(1, 1), 1 + 1 / 16);
    assert.equal(weightLbsFromLbsOz(0, 0), 0);
  });

  it("treats a blank ounce field as 0 and a blank pound field as 0", () => {
    assert.equal(parseScaleWeight("5", ""), 5);
    assert.equal(parseScaleWeight("5", "   "), 5);
    assert.equal(parseScaleWeight("", "8"), 0.5);
    assert.equal(parseScaleWeight("5.0", "0"), 5);
  });

  it("rejects empty, fractional, and out-of-range ounces", () => {
    assert.throws(() => parseScaleWeight("", ""), /pounds and ounces/);
    assert.throws(() => parseScaleWeight("0", "0"), /greater than 0/);
    assert.throws(() => parseScaleWeight("5.5", "0"), /whole number/);
    assert.throws(() => weightLbsFromLbsOz(1, 1.5), /0 to 15/);
    assert.throws(() => weightLbsFromLbsOz(1, 16), /0 to 15/);
    assert.throws(() => weightLbsFromLbsOz(-1, 0), /whole number/);
    assert.throws(() => parseScaleWeight("nope", "2"), /whole number/);
  });

  it("splits stored pounds back to the nearest ounce and round-trips", () => {
    assert.deepEqual(lbsOzFromWeightLbs(5.5), { lbs: 5, oz: 8 });
    assert.deepEqual(lbsOzFromWeightLbs(5), { lbs: 5, oz: 0 });
    assert.deepEqual(lbsOzFromWeightLbs(0.5), { lbs: 0, oz: 8 });
    assert.deepEqual(lbsOzFromWeightLbs(5.33), { lbs: 5, oz: 5 });
    assert.deepEqual(lbsOzFromWeightLbs(0.03125), { lbs: 0, oz: 1 });
    assert.deepEqual(lbsOzFromWeightLbs(0.03), { lbs: 0, oz: 0 });

    for (let lbs = 0; lbs <= 40; lbs += 1) {
      for (let oz = 0; oz <= 15; oz += 1) {
        if (lbs === 0 && oz === 0) continue;
        const decimal = weightLbsFromLbsOz(lbs, oz);
        const back = lbsOzFromWeightLbs(decimal);
        assert.deepEqual(back, { lbs, oz });
        assert.equal(weightLbsFromLbsOz(back.lbs, back.oz), decimal);
      }
    }

    const snapped = lbsOzFromWeightLbs(5.33);
    const snappedLbs = weightLbsFromLbsOz(snapped.lbs, snapped.oz);
    assert.deepEqual(lbsOzFromWeightLbs(snappedLbs), snapped);
  });

  it("formats a tournament-style weight without changing the decimal board string", () => {
    assert.equal(formatWeightLbs(5.5), "5.50 lb");
    assert.equal(formatWeightLbsOz(5.5), "5 lb 8 oz");
    assert.equal(formatWeightLbsOz(5), "5 lb 0 oz");
    assert.equal(formatWeightLbsOz(0.5), "0 lb 8 oz");
    assert.equal(formatWeightLbsOz(null), "—");
    assert.equal(formatWeightLbsOz(Number.NaN), "—");
  });
});
