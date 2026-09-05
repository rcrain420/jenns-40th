import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { directoryStatusLabel, toDirectoryTeam } from "./teams-directory.ts";

describe("teams directory", () => {
  it("lists roster names with Joined/Pending and never emails", () => {
    const team = toDirectoryTeam({
      id: "team_1",
      teamName: "Celebrators",
      ownTeamId: "team_1",
      anglers: [
        { fullName: "Aaron", email: "aaron@example.com" },
        { fullName: "Pat", email: "pat@example.com" },
        { fullName: "Rowan", email: "parent@example.com", isYouth: true },
        { fullName: "Walkup", email: null },
      ],
      members: [{ name: "Aaron", email: "aaron@example.com" }],
    });

    assert.equal(team.isOwn, true);
    assert.deepEqual(
      team.anglers.map((row) => ({ name: row.name, label: row.statusLabel })),
      [
        { name: "Aaron", label: "Joined" },
        { name: "Pat", label: "Pending" },
        { name: "Rowan", label: "Youth · parent login" },
        { name: "Walkup", label: null },
      ],
    );
    const blob = JSON.stringify(team);
    assert.equal(blob.includes("@"), false);
    assert.equal(/\bPIN\b/i.test(blob), false);
  });

  it("does not invent a status for name-only seats", () => {
    assert.equal(directoryStatusLabel("name-only"), null);
    assert.equal(directoryStatusLabel("joined"), "Joined");
    assert.equal(directoryStatusLabel("pending"), "Pending");
  });
});
