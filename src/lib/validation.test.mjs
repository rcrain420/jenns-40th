import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { optionalAnglerEmailSchema } = await import("./angler-email.ts");
const {
  SHIRT_SIZE_REQUIRED_ERROR,
  isShirtSize,
  missingShirtSize,
} = await import("./shirt-size.ts");
const {
  YOUTH_ATTESTATION_ERROR,
  youthAttestationResult,
} = await import("./youth.ts");
const {
  amountDueCents,
  amountDueForEntry,
  ENTRY_KIND,
  listedPots,
  MIN_ANGLERS,
  paidEntrySeatCount,
  SIDE_POT_IDS,
  VENMO_HANDLE,
  VENMO_USERNAME,
  YOUTH_TOURNAMENT,
  getVenmoUrl,
} = await import("./config.ts");
const {
  boatRosterCapacityIssue,
  youthLandRosterCapacityIssue,
} = await import("./roster-capacity.ts");
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

  it("lets a youth seat stay email-optional and does not change the $300 boat entry", () => {
    const email = optionalAnglerEmailSchema.parse("");
    assert.equal(email, undefined);
    const parentEmail = optionalAnglerEmailSchema.parse("parent@example.com");
    assert.equal(parentEmail, "parent@example.com");
    assert.equal(amountDueCents(0), 30000);
    assert.equal(amountDueCents(1), 35000);
    assert.equal(paidEntrySeatCount([{ isYouth: false }, { isYouth: true }]), 1);
    assert.equal(SIDE_POT_IDS.includes("kids"), false);
  });

  it("keeps 3 adults + 1 youth as a $300 boat with a free adult seat left", () => {
    assert.equal(
      paidEntrySeatCount([
        { isYouth: false },
        { isYouth: false },
        { isYouth: false },
        { isYouth: true },
      ]),
      3,
    );
    assert.equal(amountDueCents(0), 30000);
  });

  it("allows a single fishing angler and keeps the boat fee flat", () => {
    assert.equal(MIN_ANGLERS, 1);
    assert.equal(amountDueCents(0), 30000);
    assert.equal(amountDueCents(2), 40000);
  });
});

describe("shirt size on register", () => {
  it("requires a standard size on each named angler", () => {
    assert.equal(isShirtSize("L"), true);
    assert.equal(isShirtSize("3XL"), true);
    assert.equal(isShirtSize(""), false);
    assert.equal(isShirtSize("YY"), false);
    assert.equal(SHIRT_SIZE_REQUIRED_ERROR, "Shirt size is required");
    assert.equal(
      missingShirtSize([
        { fullName: "Aaron QA", shirtSize: "L" },
        { fullName: "Rowan QA", shirtSize: "XS" },
      ]),
      false,
    );
    assert.equal(
      missingShirtSize([
        { fullName: "Aaron QA", shirtSize: "L" },
        { fullName: "Rowan QA" },
      ]),
      true,
    );
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

describe("Venmo handle", () => {
  it("points payments at Jennski", () => {
    assert.equal(VENMO_USERNAME, "Jennski");
    assert.equal(VENMO_HANDLE, "Jennski");
    assert.equal(getVenmoUrl(), "https://venmo.com/u/Jennski");
  });
});

describe("boat vs land registration capacity", () => {
  it("accepts 3 adults and 1 youth on a boat", () => {
    assert.equal(
      boatRosterCapacityIssue([
        { isYouth: false },
        { isYouth: false },
        { isYouth: false },
        { isYouth: true },
      ]),
      null,
    );
  });

  it("accepts 4 adults plus youth on a boat", () => {
    assert.equal(
      boatRosterCapacityIssue([
        { isYouth: false },
        { isYouth: false },
        { isYouth: false },
        { isYouth: false },
        { isYouth: true },
      ]),
      null,
    );
  });

  it("rejects a boat with only youth", () => {
    assert.ok(boatRosterCapacityIssue([{ isYouth: true }]));
  });

  it("keeps land-only RowRide at $0 and youth-only", () => {
    assert.equal(
      youthLandRosterCapacityIssue([{ isYouth: true }, { isYouth: true }]),
      null,
    );
    assert.ok(youthLandRosterCapacityIssue([{ isYouth: false }]));
    assert.equal(amountDueForEntry({ entryKind: ENTRY_KIND.YOUTH_LAND }), 0);
  });
});

describe("kids pot $0 listing", () => {
  it("lists the youth tournament at $0 and never as a paid Team.sidePots id", () => {
    const pots = listedPots();
    const kids = pots.find((pot) => pot.id === "kids");
    assert.ok(kids);
    assert.equal(kids.name, YOUTH_TOURNAMENT.name);
    assert.equal(kids.buyInCents, 0);
    assert.equal(kids.hostFunded, true);
    assert.equal(SIDE_POT_IDS.includes("kids"), false);
    assert.equal(
      pots.some((pot) => pot.id === "catfish" && pot.buyInCents === 0),
      true,
    );
  });
});
