import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REGISTER_ALREADY_IN,
  REGISTER_WELCOME,
  afterAuthPath,
  registerApiAllowsCreate,
  registerPageView,
  userHasRegisteredTeam,
} from "./register-logged-in.ts";

const banned = [
  /venmo/i,
  /invite/i,
  /register your team/i,
  /team name/i,
  /captain/i,
  /side pot/i,
  /create a team/i,
  /password/i,
  /sign in/i,
];

describe("logged-in /register gate", () => {
  it("shows the form until the account is actually on a boat", () => {
    assert.equal(userHasRegisteredTeam(null), false);
    assert.equal(userHasRegisteredTeam({ teamName: null }), false);
    assert.equal(userHasRegisteredTeam({ teamName: "Redfish Rodeo" }), true);

    assert.equal(registerPageView(false), "form");
    assert.equal(registerPageView(true), "already-registered");
    assert.equal(registerApiAllowsCreate(false), true);
    assert.equal(registerApiAllowsCreate(true), false);
  });

  it("welcomes signed-in users who still need to register a team", () => {
    assert.match(REGISTER_WELCOME.title, /welcome/i);
    assert.match(REGISTER_WELCOME.body, /not on a boat/i);
    assert.match(REGISTER_WELCOME.body, /register your team/i);
  });

  it("already-registered UI is only a boat link — no form, Venmo, or invites", () => {
    const text = `${REGISTER_ALREADY_IN.title} ${REGISTER_ALREADY_IN.body} ${REGISTER_ALREADY_IN.ctaLabel}`;
    assert.match(text, /already registered/i);
    assert.match(text, /nothing else is needed/i);
    assert.equal(REGISTER_ALREADY_IN.ctaHref, "/team");
    assert.match(REGISTER_ALREADY_IN.ctaLabel, /boat/i);
    for (const pattern of banned) {
      assert.equal(pattern.test(text), false, String(pattern));
      assert.equal(pattern.test(REGISTER_ALREADY_IN.ctaHref), false, String(pattern));
    }
  });

  it("sends no-team auth landings away from the success dead-end", () => {
    assert.equal(
      afterAuthPath({ next: "/register/success", hasTeam: false }),
      "/register",
    );
    assert.equal(
      afterAuthPath({ next: "/register/success", hasTeam: true }),
      "/team",
    );
    assert.equal(afterAuthPath({ next: "/catches", hasTeam: false }), "/catches");
    assert.equal(afterAuthPath({ next: "/register", hasTeam: false }), "/register");
  });
});
