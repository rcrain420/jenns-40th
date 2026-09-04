import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REGISTER_ALREADY_IN,
  REGISTER_AUTH,
  REGISTER_WELCOME,
  afterAuthPath,
  registerApiAllowsCreate,
  registerAuthMode,
  registerContinuePath,
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
  it("shows auth first when logged out — never the team form", () => {
    assert.equal(
      registerPageView({ signedIn: false, hasTeam: false }),
      "auth",
    );
    assert.equal(
      registerPageView({ signedIn: false, hasTeam: true }),
      "auth",
    );
    assert.equal(
      registerApiAllowsCreate({ signedIn: false, hasTeam: false }),
      false,
    );
  });

  it("shows the form until the signed-in account is actually on a boat", () => {
    assert.equal(userHasRegisteredTeam(null), false);
    assert.equal(userHasRegisteredTeam({ teamName: null }), false);
    assert.equal(userHasRegisteredTeam({ teamName: "Redfish Rodeo" }), true);

    assert.equal(
      registerPageView({ signedIn: true, hasTeam: false }),
      "form",
    );
    assert.equal(
      registerPageView({ signedIn: true, hasTeam: true }),
      "already-registered",
    );
    assert.equal(
      registerApiAllowsCreate({ signedIn: true, hasTeam: false }),
      true,
    );
    assert.equal(
      registerApiAllowsCreate({ signedIn: true, hasTeam: true }),
      false,
    );
  });

  it("opens Create account first, same as Join the boat", () => {
    assert.equal(registerAuthMode(), "signup");
    assert.match(REGISTER_AUTH.title, /create an account/i);
    assert.match(REGISTER_AUTH.body, /google/i);
    assert.match(REGISTER_AUTH.body, /log in/i);
    assert.equal(/facebook/i.test(REGISTER_AUTH.body), false);
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

  it("keeps youth and guide prefill on the auth next path", () => {
    assert.equal(registerContinuePath(), "/register");
    assert.equal(registerContinuePath({}), "/register");
    assert.equal(
      registerContinuePath({ youth: "1" }),
      "/register?youth=1",
    );
    assert.equal(
      registerContinuePath({ boat: "GUIDED", captain: "Tina" }),
      "/register?boat=GUIDED&captain=Tina",
    );
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
    assert.equal(
      afterAuthPath({ next: "/register?youth=1", hasTeam: false }),
      "/register?youth=1",
    );
  });
});
