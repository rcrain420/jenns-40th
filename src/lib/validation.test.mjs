import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { optionalAnglerEmailSchema } = await import("./angler-email.ts");

describe("optional angler email", () => {
  it("allows a blank seat and keeps a valid plus-alias", () => {
    assert.equal(optionalAnglerEmailSchema.safeParse("").success, true);
    assert.equal(optionalAnglerEmailSchema.safeParse("   ").success, true);
    assert.equal(optionalAnglerEmailSchema.safeParse(undefined).success, true);
    assert.equal(optionalAnglerEmailSchema.parse(""), undefined);
    assert.equal(
      optionalAnglerEmailSchema.parse("acrain.ccg+captain@gmail.com"),
      "acrain.ccg+captain@gmail.com",
    );
  });

  it("rejects junk without requiring an email", () => {
    assert.equal(optionalAnglerEmailSchema.safeParse("not-an-email").success, false);
  });
});
