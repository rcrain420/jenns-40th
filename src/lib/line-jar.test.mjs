import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatLineJarSubmitted,
  lineJarPaidLabel,
  orderLineJarGuessesNewestFirst,
  toLineJarGuessView,
} from "./line-jar.ts";

function row(overrides) {
  return {
    id: "a",
    name: "Ada",
    guessedLengthInches: 125.5,
    donationCents: 2500,
    paid: false,
    createdAt: new Date("2026-10-09T18:30:00.000Z"),
    ...overrides,
  };
}

describe("orderLineJarGuessesNewestFirst", () => {
  it("sorts newest submissions first", () => {
    const ordered = orderLineJarGuessesNewestFirst([
      row({ id: "old", createdAt: new Date("2026-10-08T15:00:00.000Z") }),
      row({ id: "new", createdAt: new Date("2026-10-10T15:00:00.000Z") }),
      row({ id: "mid", createdAt: new Date("2026-10-09T15:00:00.000Z") }),
    ]);
    assert.deepEqual(
      ordered.map((entry) => entry.id),
      ["new", "mid", "old"],
    );
  });

  it("breaks equal timestamps by id descending and leaves the input alone", () => {
    const submitted = new Date("2026-10-09T18:30:00.000Z");
    const input = [
      row({ id: "a", createdAt: submitted }),
      row({ id: "c", createdAt: submitted }),
      row({ id: "b", createdAt: submitted }),
    ];
    const ordered = orderLineJarGuessesNewestFirst(input);
    assert.deepEqual(
      ordered.map((entry) => entry.id),
      ["c", "b", "a"],
    );
    assert.deepEqual(
      input.map((entry) => entry.id),
      ["a", "c", "b"],
    );
  });
});

describe("line jar display", () => {
  it("labels paid and unpaid donations", () => {
    assert.equal(lineJarPaidLabel(true), "Paid");
    assert.equal(lineJarPaidLabel(false), "Unpaid");
  });

  it("shows name, inches, dollars, paid, and Chicago submit time", () => {
    const view = toLineJarGuessView(
      row({ name: "Jenn", paid: true, donationCents: 2000 }),
    );
    assert.equal(view.name, "Jenn");
    assert.equal(view.guessedLength, "125.5 in");
    assert.equal(view.donation, "$20.00");
    assert.equal(view.paid, true);
    assert.equal(view.paidLabel, "Paid");
    assert.equal(view.submitted, "Oct 9, 2026, 1:30 PM");
  });

  it("formats an unpaid guess the same way", () => {
    const view = toLineJarGuessView(row({ paid: false, donationCents: 500 }));
    assert.equal(view.paidLabel, "Unpaid");
    assert.equal(view.donation, "$5.00");
  });
});

describe("formatLineJarSubmitted", () => {
  it("returns a dash for an invalid timestamp", () => {
    assert.equal(formatLineJarSubmitted(new Date("nope")), "—");
  });
});
