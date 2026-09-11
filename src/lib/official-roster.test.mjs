import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BOAT_ENTRY_CENTS } from "./config.ts";
import { formatUsdWhole } from "./money.ts";
import {
  alsoOnThisBoatLine,
  groupOfficialRosterByBoat,
  officialRosterAdultSeatCount,
  officialRosterAnglerLine,
  officialRosterBoatPotCents,
  officialRosterLandSummary,
  officialRosterPotAmountLabel,
  officialRosterPotCents,
  officialRosterPotSummary,
} from "./official-roster.ts";

describe("official roster grouped by boat", () => {
  it("nests official names under each boat heading", () => {
    const boats = groupOfficialRosterByBoat([
      {
        id: "boat_tight",
        teamName: "Tight Lines and Good Times",
        isOwn: true,
        anglers: [
          { fullName: "Matt Johnson" },
          { fullName: "Pratt Kramer" },
          { fullName: "Mike Wright" },
          { fullName: "Aaron Crain" },
        ],
      },
      {
        id: "boat_other",
        teamName: "Bay Bashers",
        anglers: [
          { fullName: "Pat Guest" },
          { fullName: "Rowan", isYouth: true },
        ],
      },
    ]);

    assert.deepEqual(
      boats.map((boat) => ({
        boatName: boat.boatName,
        isOwn: boat.isOwn,
        names: boat.anglers.map(officialRosterAnglerLine),
      })),
      [
        {
          boatName: "Tight Lines and Good Times",
          isOwn: true,
          names: [
            "Matt Johnson",
            "Pratt Kramer",
            "Mike Wright",
            "Aaron Crain",
          ],
        },
        {
          boatName: "Bay Bashers",
          isOwn: false,
          names: ["Pat Guest", "Rowan · youth"],
        },
      ],
    );
  });

  it("keeps Angler/Youth labels and never invents unpaid, email, or PIN", () => {
    const boats = groupOfficialRosterByBoat([
      {
        id: "boat_1",
        teamName: "Celebrators",
        anglers: [
          { fullName: "Aaron", statusLabel: "Angler · Joined" },
          { fullName: "Pat", statusLabel: "Angler · Pending" },
          { fullName: "Walkup", statusLabel: "Angler" },
        ],
      },
    ]);
    const lines = boats[0].anglers.map(officialRosterAnglerLine);
    assert.deepEqual(lines, [
      "Aaron · Angler · Joined",
      "Pat · Angler · Pending",
      "Walkup · Angler",
    ]);
    const blob = JSON.stringify(boats);
    assert.equal(blob.includes("@"), false);
    assert.equal(/\bPIN\b/i.test(blob), false);
    assert.equal(/unpaid/i.test(blob), false);
  });

  it("shows included seats and a boat summary that matches $300 per boat", () => {
    const boats = groupOfficialRosterByBoat([
      {
        id: "boat_jarah",
        teamName: "Family Boat",
        anglers: [
          {
            fullName: "Aunt Pat",
            statusLabel: "Angler · Joined",
          },
          {
            fullName: "Uncle Mike",
            statusLabel: "Angler · Pending",
          },
          {
            fullName: "Kid One",
            isYouth: true,
            statusLabel: "Youth · parent login",
          },
          {
            fullName: "Kid Two",
            isYouth: true,
            statusLabel: "Youth · parent login",
          },
          {
            fullName: "Jarah",
            statusLabel: "Boat account",
            isAnglerSeat: false,
          },
        ],
      },
    ]);

    const rows = boats[0].anglers;
    const format = formatUsdWhole;
    assert.deepEqual(
      rows.map((row) => ({
        line: officialRosterAnglerLine(row),
        pot: officialRosterPotAmountLabel(row),
        cents: officialRosterPotCents(row),
      })),
      [
        {
          line: "Aunt Pat · Angler · Joined",
          pot: "included",
          cents: 0,
        },
        {
          line: "Uncle Mike · Angler · Pending",
          pot: "included",
          cents: 0,
        },
        {
          line: "Kid One · Youth · parent login",
          pot: "included · youth",
          cents: 0,
        },
        {
          line: "Kid Two · Youth · parent login",
          pot: "included · youth",
          cents: 0,
        },
        {
          line: "Jarah · Boat account",
          pot: "—",
          cents: 0,
        },
      ],
    );

    const adultAnglerCount = officialRosterAdultSeatCount(rows);
    const potCents = officialRosterBoatPotCents(rows, BOAT_ENTRY_CENTS);
    assert.equal(adultAnglerCount, 2);
    assert.equal(potCents, BOAT_ENTRY_CENTS);
    assert.equal(
      officialRosterPotSummary({
        boatCount: 1,
        potCents,
        format,
      }),
      "1 boat · pot $300",
    );
    assert.equal(
      alsoOnThisBoatLine(
        rows.filter((row) => row.isAnglerSeat === false).map((row) => row.name),
      ),
      "Also on this boat: Jarah (not an angler seat)",
    );
  });

  it("does not add a captain row to the pot", () => {
    const boats = groupOfficialRosterByBoat([
      {
        id: "boat_guided",
        teamName: "Guided Bay",
        anglers: [
          {
            fullName: "Aaron",
            statusLabel: "Angler · Joined",
          },
          {
            fullName: "Capt. Ron",
            statusLabel: "Captain · Pending",
            isAnglerSeat: false,
          },
        ],
      },
    ]);
    const rows = boats[0].anglers;
    assert.equal(officialRosterPotCents(rows[1]), 0);
    assert.equal(officialRosterPotAmountLabel(rows[1]), "—");
    assert.equal(
      officialRosterBoatPotCents(rows, BOAT_ENTRY_CENTS),
      BOAT_ENTRY_CENTS,
    );
    assert.equal(officialRosterAdultSeatCount(rows), 1);
    assert.equal(
      alsoOnThisBoatLine(
        rows
          .filter((row) => row.isAnglerSeat === false)
          .map((row) => officialRosterAnglerLine(row)),
      ),
      "Also on this boat: Capt. Ron · Captain · Pending (not an angler seat)",
    );
  });

  it("does not add land-only RowRide entries to the $300 boat pot", () => {
    const boats = groupOfficialRosterByBoat([
      {
        id: "land_1",
        teamName: "The Crain kids",
        entryKind: "YOUTH_LAND",
        anglers: [{ fullName: "Rowan", isYouth: true }],
      },
    ]);
    assert.equal(boats[0].entryKind, "YOUTH_LAND");
    assert.equal(
      officialRosterBoatPotCents(boats[0].anglers, BOAT_ENTRY_CENTS, "YOUTH_LAND"),
      0,
    );
    assert.equal(officialRosterLandSummary(), "RowRide · no boat fee");
  });
});
