import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catchHasAiSize, formatCatchSizeLine } from "./catch-size.ts";

describe("catch size display", () => {
  it("hides fallback and missing sizes so 18 / 3.5 cannot look real", () => {
    assert.equal(
      catchHasAiSize({
        aiProvider: "fallback",
        lengthInches: 18,
        weightLbs: 3.5,
      }),
      false,
    );
    assert.equal(
      formatCatchSizeLine({
        aiProvider: "fallback",
        lengthInches: 18,
        weightLbs: 3.5,
      }),
      "Size not estimated",
    );
    assert.equal(
      formatCatchSizeLine({
        aiProvider: "openai",
        lengthInches: 24,
        weightLbs: 6,
      }),
      '24" · 6 lb',
    );
  });
});
