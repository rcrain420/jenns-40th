import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const { JOIN_SITE_ACCESS } = await import("./join-site-access.ts");
const { OPEN_MY_TEAM_ACCESS } = await import("./open-my-team-access.ts");
const {
  JOIN_THE_BOAT,
  boatRosterStatusLabel,
  buildBoatRoster,
  joinTheBoatAuthMode,
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
