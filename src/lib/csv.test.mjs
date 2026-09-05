import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { teamsToCsv } from "./csv.ts";

describe("CSV youth column", () => {
  it("exports a youth column and marks youth seats", () => {
    const csv = teamsToCsv([
      {
        id: "team_1",
        teamName: "Bay Kids",
        boatType: "NON_GUIDED",
        captainName: null,
        captainPhone: null,
        captainEmail: null,
        contactName: "Aaron",
        contactPhone: "3615551234",
        contactEmail: "aaron@example.com",
        registrantEmail: "aaron@example.com",
        notes: null,
        licenseConfirmed: true,
        paymentStatus: "UNPAID",
        sidePots: [],
        amountDueCents: 7500,
        claimedByUserId: null,
        createdAt: new Date("2026-08-28T00:00:00.000Z"),
        updatedAt: new Date("2026-08-28T00:00:00.000Z"),
        anglers: [
          {
            id: "1",
            teamId: "team_1",
            fullName: "Aaron",
            phone: null,
            email: "aaron@example.com",
            isYouth: false,
            shirtSize: "L",
            sortOrder: 0,
          },
          {
            id: "2",
            teamId: "team_1",
            fullName: "Rowan",
            phone: null,
            email: "aaron@example.com",
            isYouth: true,
            shirtSize: "XS",
            sortOrder: 1,
          },
        ],
      },
    ]);

    const [header, row] = csv.split("\n");
    assert.match(header, /,youth,/);
    assert.match(header, /,shirtSizes,/);
    assert.match(row, /Rowan \(youth\) \[XS\]/);
    assert.match(row, /Aaron: L; Rowan: XS/);
    assert.match(row, /,Rowan,/);
  });
});
