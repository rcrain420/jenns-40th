import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminConsoleStats,
  adminDivisionLabel,
  orderTeamsForExport,
  teamMatchesAdminEntryFilter,
} from "./admin-console.ts";

const adult = (overrides = {}) => ({
  entryKind: "BOAT",
  boatType: "NON_GUIDED",
  amountDueCents: 30000,
  amountPaidCents: 0,
  anglers: [{ isYouth: false }, { isYouth: false }],
  ...overrides,
});

const rowRide = (overrides = {}) => ({
  entryKind: "YOUTH_LAND",
  boatType: "NON_GUIDED",
  amountDueCents: 0,
  amountPaidCents: 0,
  anglers: [{ isYouth: true }],
  ...overrides,
});

describe("adminConsoleStats", () => {
  it("keeps free RowRide rows out of adult money and seat counts", () => {
    const stats = adminConsoleStats([
      adult({
        boatType: "GUIDED",
        amountDueCents: 45000,
        amountPaidCents: 120000,
        anglers: [{ isYouth: false }, { isYouth: false }, { isYouth: true }],
      }),
      adult({
        amountDueCents: 45000,
        amountPaidCents: 0,
        anglers: [{ isYouth: false }],
      }),
      rowRide(),
      rowRide(),
    ]);

    assert.equal(stats.boatCount, 2);
    assert.equal(stats.adultAnglerCount, 3);
    assert.equal(stats.youthOnBoats, 1);
    assert.equal(stats.collectedCents, 120000);
    assert.equal(stats.outstandingCents, 45000);
    assert.equal(stats.rowRideCount, 2);
    assert.equal(stats.rowRideAnglerCount, 2);
    assert.equal(stats.rowRideCollectedCents, 0);
    assert.equal(stats.rowRideOutstandingCents, 0);
    assert.equal(stats.rowRideHasSidePotMoney, false);
  });

  it("reports RowRide side-pot money separately from the adult pot", () => {
    const stats = adminConsoleStats([
      adult({ amountDueCents: 30000, amountPaidCents: 30000, anglers: [] }),
      rowRide({ amountDueCents: 10000, amountPaidCents: 5000 }),
      rowRide(),
    ]);

    assert.equal(stats.collectedCents, 30000);
    assert.equal(stats.outstandingCents, 0);
    assert.equal(stats.rowRideCollectedCents, 5000);
    assert.equal(stats.rowRideOutstandingCents, 5000);
    assert.equal(stats.rowRideHasSidePotMoney, true);
    assert.equal(stats.rowRideAnglerCount, 2);
  });

  it("treats a missing entry kind as an adult boat", () => {
    const stats = adminConsoleStats([
      adult({ entryKind: undefined, amountPaidCents: 1000, anglers: [{}] }),
    ]);
    assert.equal(stats.boatCount, 1);
    assert.equal(stats.adultAnglerCount, 1);
    assert.equal(stats.rowRideCount, 0);
    assert.equal(stats.collectedCents, 1000);
  });
});

describe("admin entry filter", () => {
  it("does not treat stored NON_GUIDED RowRide rows as non-guided boats", () => {
    const kid = rowRide();
    const guided = adult({ boatType: "GUIDED" });
    const open = adult({ boatType: "NON_GUIDED" });

    assert.equal(teamMatchesAdminEntryFilter(kid, "NON_GUIDED"), false);
    assert.equal(teamMatchesAdminEntryFilter(kid, "GUIDED"), false);
    assert.equal(teamMatchesAdminEntryFilter(kid, "YOUTH_LAND"), true);
    assert.equal(teamMatchesAdminEntryFilter(kid, "ALL"), true);
    assert.equal(teamMatchesAdminEntryFilter(guided, "GUIDED"), true);
    assert.equal(teamMatchesAdminEntryFilter(guided, "NON_GUIDED"), false);
    assert.equal(teamMatchesAdminEntryFilter(guided, "YOUTH_LAND"), false);
    assert.equal(teamMatchesAdminEntryFilter(open, "NON_GUIDED"), true);
    assert.equal(teamMatchesAdminEntryFilter(open, "ALL"), true);
  });
});

describe("export ordering", () => {
  it("lists adult boats before RowRide and labels the division", () => {
    const ordered = orderTeamsForExport([
      { id: "kid-1", entryKind: "YOUTH_LAND" },
      { id: "boat-1", entryKind: "BOAT" },
      { id: "kid-2", entryKind: "YOUTH_LAND" },
      { id: "boat-2", entryKind: "BOAT" },
    ]);
    assert.deepEqual(
      ordered.map((team) => team.id),
      ["boat-1", "boat-2", "kid-1", "kid-2"],
    );
    assert.equal(adminDivisionLabel("BOAT"), "Adult");
    assert.equal(adminDivisionLabel("YOUTH_LAND"), "RowRide");
    assert.equal(adminDivisionLabel(undefined), "Adult");
  });
});
