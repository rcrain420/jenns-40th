import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const { JOIN_SITE_ACCESS } = await import("./join-site-access.ts");
const { OPEN_MY_TEAM_ACCESS } = await import("./open-my-team-access.ts");
const {
  BOAT_FULL_MESSAGE,
  BOAT_FULL_NOTE,
  JOIN_THE_BOAT,
  boatRosterStatusLabel,
  buildBoatRoster,
  canJoinBoat,
  directoryStatusLabel,
  invitedAnglerCount,
  isBoatInviteLocked,
  joinFillsExistingSeat,
  joinTheBoatAuthMode,
  rosterWouldExceedInviteCapacity,
  toDirectoryTeam,
} = await import("./join-the-boat.ts");
const { anglerInvitePath, issueTeamInviteToken } = await import(
  "./team-invite-token.ts"
);

describe("Join the boat first tap", () => {
  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  });

  it("is Create account with the invitee email, never Sign in or magic session", () => {
    assert.equal(JOIN_THE_BOAT.firstTap, "create-account");
    assert.equal(JOIN_THE_BOAT.silentUserSession, false);
    assert.equal(joinTheBoatAuthMode(), "signup");
    assert.equal(joinTheBoatAuthMode() === "signin", false);

    const { token } = issueTeamInviteToken({ teamId: "team_boat" });
    const path = anglerInvitePath(token, "Jenn@Example.com", "Jenn");
    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    assert.equal(params.get("email"), "jenn@example.com");
    assert.equal(params.get("name"), "Jenn");
  });

  it("stays a separate path from Open my team and does not make captain", () => {
    assert.equal(JOIN_THE_BOAT.makesCaptain, false);
    assert.equal(JOIN_THE_BOAT.addsPaidRoster, false);
    assert.equal(JOIN_SITE_ACCESS.addsPaidRoster, false);
    assert.equal(JOIN_SITE_ACCESS.makesCaptain, false);
    assert.equal(OPEN_MY_TEAM_ACCESS.firstTap, "create-account");
  });
});

describe("boat roster after Join the boat", () => {
  it("attaches the invitee name as Joined without a paid roster seat", () => {
    const pending = buildBoatRoster({
      anglers: [
        { fullName: "Aaron Crain", email: "aaron@example.com" },
        { fullName: "Mike", email: "acrainatx@gmail.com" },
      ],
      members: [{ name: "Aaron Crain", email: "aaron@example.com" }],
    });
    assert.deepEqual(
      pending.map((row) => ({ name: row.name, status: row.status })),
      [
        { name: "Aaron Crain", status: "joined" },
        { name: "Mike", status: "pending" },
      ],
    );

    const afterJoin = buildBoatRoster({
      anglers: [
        { fullName: "Aaron Crain", email: "aaron@example.com" },
        { fullName: "Mike", email: "acrainatx@gmail.com" },
      ],
      members: [
        { name: "Aaron Crain", email: "aaron@example.com" },
        { name: "Mike Guest", email: "acrainatx@gmail.com" },
      ],
    });
    assert.deepEqual(
      afterJoin.map((row) => ({ name: row.name, status: row.status })),
      [
        { name: "Aaron Crain", status: "joined" },
        { name: "Mike", status: "joined" },
      ],
    );
    assert.equal(JOIN_THE_BOAT.addsPaidRoster, false);
  });

  it("lists emailed invitees as Pending until they finish join", () => {
    const rows = buildBoatRoster({
      anglers: [
        { fullName: "Pat Email", email: "pat@example.com" },
        { fullName: "Later Invite", email: " later@example.com " },
      ],
      members: [],
    });
    assert.deepEqual(
      rows.map((row) => ({ name: row.name, status: row.status })),
      [
        { name: "Pat Email", status: "pending" },
        { name: "Later Invite", status: "pending" },
      ],
    );
    assert.equal(boatRosterStatusLabel("pending"), "Pending");
    assert.equal(boatRosterStatusLabel("joined"), "Joined");
  });

  it("keeps name-only seats as not-emailed and still attaches a joiner with no paid seat", () => {
    const rows = buildBoatRoster({
      anglers: [
        { fullName: "Walkup Adult", email: null },
        { fullName: "Blank", email: "  " },
      ],
      members: [{ name: "Shared Link Joiner", email: "walkup@example.com" }],
    });
    assert.deepEqual(rows, [
      { name: "Walkup Adult", email: null, status: "name-only" },
      { name: "Blank", email: null, status: "name-only" },
      {
        name: "Shared Link Joiner",
        email: "walkup@example.com",
        status: "joined",
      },
    ]);
    assert.equal(
      boatRosterStatusLabel("name-only"),
      "Name-only · not emailed",
    );
  });

  it("marks youth seats as parent-login, never pending create-account", () => {
    const rows = buildBoatRoster({
      anglers: [
        { fullName: "Aaron", email: "aaron@example.com" },
        { fullName: "Rowan", email: "aaron@example.com", isYouth: true },
      ],
      members: [{ name: "Aaron", email: "aaron@example.com" }],
    });
    assert.deepEqual(
      rows.map((row) => ({ name: row.name, status: row.status })),
      [
        { name: "Aaron", status: "joined" },
        { name: "Rowan", status: "youth" },
      ],
    );
    assert.equal(boatRosterStatusLabel("youth"), "Youth · parent login");
  });
});

describe("boat invite lock at four invited anglers", () => {
  it("stays open at three On this boat seats, including Pending", () => {
    const input = {
      anglers: [
        { fullName: "Aaron", email: "aaron@example.com" },
        { fullName: "Pat", email: "pat@example.com" },
        { fullName: "Mike", email: "mike@example.com" },
      ],
      members: [{ name: "Aaron", email: "aaron@example.com" }],
    };
    assert.equal(invitedAnglerCount(input), 3);
    assert.equal(isBoatInviteLocked(input), false);
    assert.equal(canJoinBoat(input, "new@example.com"), true);
  });

  it("locks at four Joined + Pending official seats", () => {
    const input = {
      anglers: [
        { fullName: "Matt Johnson", email: "matt@example.com" },
        { fullName: "Pratt Kramer", email: "pratt@example.com" },
        { fullName: "Mike Wright", email: "mike@example.com" },
        { fullName: "Aaron Crain", email: "aaron@example.com" },
      ],
      members: [
        { name: "Matt Johnson", email: "matt@example.com" },
        { name: "Aaron Crain", email: "aaron@example.com" },
      ],
    };
    assert.equal(invitedAnglerCount(input), 4);
    assert.equal(isBoatInviteLocked(input), true);
    assert.equal(canJoinBoat(input, "fifth@example.com"), false);
    assert.equal(canJoinBoat(input, "pratt@example.com"), true);
    assert.equal(joinFillsExistingSeat(input, "mike@example.com"), true);
    assert.match(BOAT_FULL_MESSAGE, /4\/4/);
    assert.equal(BOAT_FULL_NOTE, "Boat is full (4/4).");
  });

  it("counts youth and name-only official seats toward the lock", () => {
    const input = {
      anglers: [
        { fullName: "Adult", email: "adult@example.com" },
        { fullName: "Kid", email: "parent@example.com", isYouth: true },
        { fullName: "Walkup", email: null },
        { fullName: "Later", email: "later@example.com" },
      ],
      members: [{ name: "Adult", email: "adult@example.com" }],
    };
    assert.equal(isBoatInviteLocked(input), true);
    assert.equal(joinFillsExistingSeat(input, "parent@example.com"), false);
    assert.equal(canJoinBoat(input, "parent@example.com"), false);
  });

  it("counts share-link joiners who are not on the paid roster", () => {
    const input = {
      anglers: [
        { fullName: "Walkup", email: null },
        { fullName: "Other", email: null },
      ],
      members: [
        { name: "Link One", email: "one@example.com" },
        { name: "Link Two", email: "two@example.com" },
      ],
    };
    assert.equal(invitedAnglerCount(input), 4);
    assert.equal(isBoatInviteLocked(input), true);
    assert.equal(canJoinBoat(input, "three@example.com"), false);
  });

  it("does not treat the captain name as an invited seat", () => {
    const input = {
      anglers: [
        { fullName: "Aaron", email: "aaron@example.com" },
        { fullName: "Pat", email: "pat@example.com" },
      ],
      members: [{ name: "Aaron", email: "aaron@example.com" }],
    };
    assert.equal(invitedAnglerCount(input), 2);
    assert.equal(isBoatInviteLocked(input), false);
  });

  it("rejects adding a fifth official seat when extra joiners already fill the boat", () => {
    const current = {
      anglers: [
        { fullName: "A", email: null },
        { fullName: "B", email: null },
      ],
      members: [
        { name: "Link One", email: "one@example.com" },
        { name: "Link Two", email: "two@example.com" },
      ],
    };
    assert.equal(
      rosterWouldExceedInviteCapacity({
        current,
        nextAnglers: [
          ...current.anglers,
          { fullName: "C", email: "c@example.com" },
        ],
      }),
      true,
    );
    assert.equal(
      rosterWouldExceedInviteCapacity({
        current,
        nextAnglers: current.anglers,
      }),
      false,
    );
  });

  it("allows saving an already-over roster without adding another seat", () => {
    const current = {
      anglers: [
        { fullName: "A", email: "a@example.com" },
        { fullName: "B", email: "b@example.com" },
        { fullName: "C", email: "c@example.com" },
        { fullName: "D", email: "d@example.com" },
      ],
      members: [{ name: "Extra", email: "extra@example.com" }],
    };
    assert.equal(invitedAnglerCount(current), 5);
    assert.equal(
      rosterWouldExceedInviteCapacity({
        current,
        nextAnglers: current.anglers,
      }),
      false,
    );
  });
});

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
