import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SHIRT_SIZE_REQUIRED_ERROR,
  SHIRT_SIZES,
  isShirtSize,
  missingShirtSize,
} from "./shirt-size.ts";

describe("shirt sizes", () => {
  it("lists standard adult sizes including 3XL", () => {
    assert.deepEqual(SHIRT_SIZES, ["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
    assert.equal(isShirtSize("L"), true);
    assert.equal(isShirtSize("3XL"), true);
    assert.equal(isShirtSize(""), false);
    assert.equal(isShirtSize("XXS"), false);
    assert.equal(SHIRT_SIZE_REQUIRED_ERROR, "Shirt size is required");
  });

  it("requires a size on each named angler, youth included", () => {
    assert.equal(
      missingShirtSize([
        { fullName: "Aaron", shirtSize: "L" },
        { fullName: "Rowan", shirtSize: "YS" },
      ]),
      true,
    );
    assert.equal(
      missingShirtSize([
        { fullName: "Aaron", shirtSize: "L" },
        { fullName: "Rowan", shirtSize: "XS" },
      ]),
      false,
    );
    assert.equal(
      missingShirtSize([{ fullName: "", shirtSize: "" }]),
      false,
    );
  });
});
