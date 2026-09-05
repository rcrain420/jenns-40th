import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FEE_PER_ANGLER_CENTS } from "./config.ts";
import { formatUsdWhole } from "./money.ts";
import {
  alsoOnThisBoatLine,
  groupOfficialRosterByBoat,
  officialRosterAdultSeatCount,
  officialRosterAnglerLine,
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

  it("shows per-row pot amounts and a boat summary that matches adult seats × fee", () => {
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
        pot: officialRosterPotAmountLabel(row, FEE_PER_ANGLER_CENTS, format),
        cents: officialRosterPotCents(row, FEE_PER_ANGLER_CENTS),
      })),
      [
        {
          line: "Aunt Pat · Angler · Joined",
          pot: "$75",
          cents: FEE_PER_ANGLER_CENTS,
        },
        {
          line: "Uncle Mike · Angler · Pending",
          pot: "$75",
          cents: FEE_PER_ANGLER_CENTS,
        },
        {
          line: "Kid One · Youth · parent login",
          pot: "$0 · youth",
          cents: 0,
        },
        {
          line: "Kid Two · Youth · parent login",
          pot: "$0 · youth",
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
    const potCents = adultAnglerCount * FEE_PER_ANGLER_CENTS;
    assert.equal(adultAnglerCount, 2);
    assert.equal(potCents, 15000);
    assert.equal(
      officialRosterPotSummary({
        adultAnglerCount,
        potCents,
        format,
      }),
      "2 adult anglers · pot $150",
    );
    assert.equal(
      alsoOnThisBoatLine(
        rows.filter((row) => row.isAnglerSeat === false).map((row) => row.name),
      ),
      "Also on this boat: Jarah (not an angler seat)",
    );
  });
});
