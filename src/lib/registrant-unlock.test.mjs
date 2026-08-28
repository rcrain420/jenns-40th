import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const { unlockLandingPath } = await import("./event-unlock-token.ts");
const { JOIN_SITE_ACCESS } = await import("./join-site-access.ts");
const { OPEN_MY_TEAM_ACCESS, OPEN_MY_TEAM_NEXT } = await import(
  "./open-my-team-access.ts"
);
const {
  openMyTeamLandingPath,
  planOpenMyTeamUnlock,
  registrantClaimMatches,
} = await import("./registrant-unlock.ts");

const TEAM_ID = "cmtd6l49d0003if04drr4vtvf";
const EMAIL = "Aaron@Example.com";

describe("Open my team unlock contract", () => {
  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  });

  it("does not magic-sign the registrant in on the first tap", () => {
    assert.equal(OPEN_MY_TEAM_ACCESS.silentUserSession, false);
    assert.equal(OPEN_MY_TEAM_ACCESS.firstTap, "create-account");

    const plan = planOpenMyTeamUnlock({ teamId: TEAM_ID, email: EMAIL });
    assert.equal(plan.setUserSession, false);
    assert.equal(plan.grantEventUnlock, true);
    assert.equal(plan.rememberClaim, true);
  });

  it("first tap lands on Create account with the registrant email, never Sign in", () => {
    const location = openMyTeamLandingPath({ email: EMAIL });
    const url = new URL(location, "https://officialishfishingtournament.com");

    assert.equal(url.pathname, "/login");
    assert.equal(url.searchParams.get("mode"), "signup");
    assert.equal(url.searchParams.get("email"), "aaron@example.com");
    assert.equal(url.searchParams.get("next"), OPEN_MY_TEAM_NEXT);
    assert.equal(url.searchParams.get("mode") === "signin", false);
    assert.equal(location.includes("mode=signin"), false);
    assert.equal(location.startsWith("/catches"), false);
    assert.equal(location.startsWith("/team"), false);
  });

  it("keeps the PR #7 event-unlock landing for a pure event token", () => {
    assert.equal(unlockLandingPath(), "/catches?unlocked=1");
    const registrant = planOpenMyTeamUnlock({ teamId: TEAM_ID, email: EMAIL });
    assert.notEqual(registrant.location, unlockLandingPath());
  });

  it("after create, grants Livewell access without making them captain or paid roster", () => {
    assert.equal(OPEN_MY_TEAM_ACCESS.verifiesEmailAfterCreate, true);
    assert.equal(OPEN_MY_TEAM_ACCESS.grantsEventUnlock, true);
    assert.equal(OPEN_MY_TEAM_ACCESS.makesCaptain, false);
    assert.equal(OPEN_MY_TEAM_ACCESS.addsPaidRoster, false);
    assert.equal(OPEN_MY_TEAM_NEXT, "/team");
  });

  it("does not reuse the Join the boat contract", () => {
    assert.equal(JOIN_SITE_ACCESS.makesCaptain, false);
    assert.equal(OPEN_MY_TEAM_ACCESS.makesCaptain, false);
    assert.notEqual(OPEN_MY_TEAM_ACCESS.firstTap, undefined);
    assert.equal("firstTap" in JOIN_SITE_ACCESS, false);
    assert.equal(OPEN_MY_TEAM_ACCESS.silentUserSession, false);
  });

  it("only applies the pending claim to the matching registrant email", () => {
    const claim = { teamId: TEAM_ID, email: "aaron@example.com" };
    assert.equal(registrantClaimMatches(claim, "Aaron@Example.com"), true);
    assert.equal(registrantClaimMatches(claim, "other@example.com"), false);
    assert.equal(registrantClaimMatches(null, "aaron@example.com"), false);
  });
});
