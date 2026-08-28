import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveCatchAnglerCredit,
  WHO_CAUGHT_NOT_ON_TEAM_ERROR,
  WHO_CAUGHT_REQUIRED_ERROR,
} from "./catch-credit.ts";

const adult = { id: "a1", fullName: "Aaron" };
const kid = { id: "a2", fullName: "Rowan" };

describe("who caught this", () => {
  it("requires an anglerId when the team has more than one angler", () => {
    const missing = resolveCatchAnglerCredit({
      teamAnglers: [adult, kid],
    });
    assert.deepEqual(missing, {
      ok: false,
      error: WHO_CAUGHT_REQUIRED_ERROR,
    });

    const credited = resolveCatchAnglerCredit({
      teamAnglers: [adult, kid],
      requestedAnglerId: kid.id,
    });
    assert.deepEqual(credited, { ok: true, anglerId: kid.id });
  });

  it("rejects an angler who is not on the team", () => {
    const result = resolveCatchAnglerCredit({
      teamAnglers: [adult, kid],
      requestedAnglerId: "someone-else",
    });
    assert.deepEqual(result, {
      ok: false,
      error: WHO_CAUGHT_NOT_ON_TEAM_ERROR,
    });
  });

  it("auto-credits the only angler when the team has one seat", () => {
    const result = resolveCatchAnglerCredit({
      teamAnglers: [kid],
    });
    assert.deepEqual(result, { ok: true, anglerId: kid.id });
  });
});
