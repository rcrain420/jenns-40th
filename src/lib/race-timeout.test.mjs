import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { raceTimeout } from "./race-timeout.ts";

describe("raceTimeout", () => {
  it("returns the value when the promise wins", async () => {
    const value = await raceTimeout(Promise.resolve(7), 200);
    assert.equal(value, 7);
  });

  it("rejects when the promise never settles", async () => {
    await assert.rejects(
      () => raceTimeout(new Promise(() => {}), 20, "too slow"),
      /too slow/,
    );
  });
});
