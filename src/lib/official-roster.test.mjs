import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupOfficialRosterByBoat,
  officialRosterAnglerLine,
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

  it("keeps existing Joined/Pending labels and never invents unpaid, email, or PIN", () => {
    const boats = groupOfficialRosterByBoat([
      {
        id: "boat_1",
        teamName: "Celebrators",
        anglers: [
          { fullName: "Aaron", statusLabel: "Joined" },
          { fullName: "Pat", statusLabel: "Pending" },
          { fullName: "Walkup" },
        ],
      },
    ]);
    const lines = boats[0].anglers.map(officialRosterAnglerLine);
    assert.deepEqual(lines, [
      "Aaron · Joined",
      "Pat · Pending",
      "Walkup",
    ]);
    const blob = JSON.stringify(boats);
    assert.equal(blob.includes("@"), false);
    assert.equal(/\bPIN\b/i.test(blob), false);
    assert.equal(/unpaid/i.test(blob), false);
  });
});
