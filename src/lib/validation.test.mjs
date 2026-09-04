import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { optionalAnglerEmailSchema } = await import("./angler-email.ts");
const {
  YOUTH_ATTESTATION_ERROR,
  youthAttestationResult,
} = await import("./youth.ts");
const { amountDueCents, listedPots, paidEntrySeatCount, SIDE_POT_IDS } =
  await import("./config.ts");
const {
  CAPTAIN_REQUIRED_ON_CREATE,
  contactEmailIssue,
} = await import("./boat-contact.ts");

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

describe("isYouth registration", () => {
  it("requires parent attestation when any angler is youth", () => {
    const missing = youthAttestationResult(
      [{ isYouth: false }, { isYouth: true }],
      false,
    );
    assert.deepEqual(missing, {
      ok: false,
      error: YOUTH_ATTESTATION_ERROR,
    });

    const ok = youthAttestationResult(
      [{ isYouth: false }, { isYouth: true }],
      true,
    );
    assert.deepEqual(ok, { ok: true });
  });

  it("does not require attestation when the roster is adults only", () => {
    assert.deepEqual(
      youthAttestationResult([{ isYouth: false }, { isYouth: false }], undefined),
      { ok: true },
    );
  });

  it("lets a youth seat stay email-optional and does not add $75", () => {
    const email = optionalAnglerEmailSchema.parse("");
    assert.equal(email, undefined);
    const parentEmail = optionalAnglerEmailSchema.parse("parent@example.com");
    assert.equal(parentEmail, "parent@example.com");
    assert.equal(amountDueCents(2, 0), 15000);
    assert.equal(amountDueCents(3, 1), 27500);
    assert.equal(paidEntrySeatCount([{ isYouth: false }, { isYouth: true }]), 1);
    assert.equal(
      amountDueCents([{ isYouth: false }, { isYouth: true }], 0),
      7500,
    );
    assert.equal(
      amountDueCents(
        [{ isYouth: false }, { isYouth: false }, { isYouth: true }],
        1,
      ),
      20000,
    );
    assert.equal(SIDE_POT_IDS.includes("kids"), false);
  });
});

describe("optional captain and DIY contact", () => {
  it("does not require a captain on create", () => {
    assert.equal(CAPTAIN_REQUIRED_ON_CREATE, false);
  });

  it("allows a blank contact email and rejects junk", () => {
    assert.equal(contactEmailIssue(""), null);
    assert.equal(contactEmailIssue("   "), null);
    assert.equal(contactEmailIssue(undefined), null);
    assert.equal(contactEmailIssue("aaron@example.com"), null);
    assert.equal(contactEmailIssue("not-an-email"), "Valid contact email required");
  });
});

describe("kids pot $0 listing", () => {
  it("lists the kids pot at $0 and never as a paid Team.sidePots id", () => {
    const pots = listedPots();
    const kids = pots.find((pot) => pot.id === "kids");
    assert.ok(kids);
    assert.equal(kids.buyInCents, 0);
    assert.equal(kids.hostFunded, true);
    assert.equal(SIDE_POT_IDS.includes("kids"), false);
    assert.equal(
      pots.some((pot) => pot.id === "catfish" && pot.buyInCents === 0),
      true,
    );
  });
});
