import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REGISTER_ALREADY_IN,
  registerApiAllowsCreate,
  registerPageView,
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
  it("hides the form for any Livewell session (creator or join-the-boat)", () => {
    assert.equal(registerPageView(true), "already-registered");
    assert.equal(registerPageView(false), "form");
    assert.equal(registerApiAllowsCreate(true), false);
    assert.equal(registerApiAllowsCreate(false), true);
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
});
