import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  YOUTH_COMPETITION_POLICY,
  YOUTH_MAIN_STRINGER_RULE,
  isMainStringerEligible,
  isYouthAngler,
  mainStringerEligibleAnglers,
} from "./youth.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const COPY_SURFACES = [
  "docs/tournament-rules.md",
  "docs/rowride-rules.md",
  "README.md",
  "src/app/kids/page.tsx",
  "src/app/rules/page.tsx",
  "src/app/page.tsx",
  "src/app/pots/page.tsx",
  "src/app/team/page.tsx",
  "src/app/teams/page.tsx",
  "src/app/register/page.tsx",
  "src/components/RegisterForm.tsx",
  "src/components/CatchLogger.tsx",
  "src/components/TeamRosterEditor.tsx",
  "src/components/AdminTeamEditor.tsx",
  "src/lib/register-form-copy.ts",
  "src/lib/roster-capacity.ts",
  "src/lib/youth.ts",
  "src/components/YouthLandRegisterForm.tsx",
  "src/app/register/youth/page.tsx",
  "src/app/register/success/page.tsx",
];

const LEFTOVER_MAIN_STRINGER = [
  /still count on the team stringer/i,
  /youth fish still count/i,
  /their fish still count on the team stringer/i,
];

const LEFTOVER_BOAT_REQUIRED = [
  /they fish on a real boat/i,
  /count toward that cap as roster seats/i,
  /same 1–4 cap/i,
];

/** Kids register on RowRide only — not attached to a boat roster. */
const LEFTOVER_YOUTH_ON_BOAT_REGISTER = [
  /join a registered boat roster/i,
  /register a boat \+ kids/i,
  /register a boat and add kids/i,
  /add kids if the captain/i,
  /add them if the captain or guide allows/i,
  /when kids are on the roster/i,
];

/** Fishing is land or boat — do not tell people kids may only fish from land. */
const LEFTOVER_LAND_ONLY_FISHING = [
  /Kids register separately for RowRide and fish from land/i,
  /register kids from land with no boat/i,
  /Entering kids from land with no boat/i,
  /Kids fish from land\. They are not required/i,
  /entry from land — no boat/i,
  /Kids are not on a boat and/i,
  /Enter from land/i,
  /enter kids from land/i,
  /Register from land/i,
  /from land with no boat/i,
  /Kids may only enter from land/i,
  /Kids register from land/i,
  /land-only kids/i,
  /land-only RowRide/i,
  /may only fish from land/i,
  /fish from land only/i,
];

/** PR #36 hard “kids count toward 4” — youth extras do not fill adult seats. */
const LEFTOVER_YOUTH_COUNT_TOWARD_FOUR = [
  /count toward that boat/i,
  /count toward this boat/i,
  /count toward the 4/i,
  /count toward the 1–4/i,
  /count toward the 4-angler/i,
  /kids count toward/i,
  /youth count toward the/i,
  /those kids count toward/i,
  /1–4 named anglers total/i,
  /anglers including kids/i,
  /kids included/i,
  /including youth/i,
];

describe("youth main-stringer eligibility", () => {
  it("treats 17-or-under roster seats as youth", () => {
    assert.equal(isYouthAngler({ isYouth: true }), true);
    assert.equal(isYouthAngler({ isYouth: false }), false);
    assert.equal(isYouthAngler({}), false);
  });

  it("keeps youth fish off the main tournament stringer", () => {
    assert.equal(isMainStringerEligible({ isYouth: true }), false);
    assert.equal(isMainStringerEligible({ isYouth: false }), true);
    assert.equal(isMainStringerEligible({}), true);

    const roster = [
      { id: "adult", isYouth: false },
      { id: "kid", isYouth: true },
    ];
    assert.deepEqual(mainStringerEligibleAnglers(roster), [
      { id: "adult", isYouth: false },
    ]);
  });

  it("states youth are out of main and in on side pots plus RowRide", () => {
    assert.match(YOUTH_MAIN_STRINGER_RULE, /do not participate/i);
    assert.match(YOUTH_MAIN_STRINGER_RULE, /main tournament stringer/i);
    assert.match(YOUTH_MAIN_STRINGER_RULE, /main pot/i);
    assert.match(YOUTH_COMPETITION_POLICY, /paid side pots/i);
    assert.match(YOUTH_COMPETITION_POLICY, /RowRide Youth Angler Tournament/i);
    assert.match(YOUTH_COMPETITION_POLICY, /do not take one/i);
    assert.match(YOUTH_COMPETITION_POLICY, /captain or guide/i);
    assert.match(YOUTH_COMPETITION_POLICY, /land\s+or\s+by\s+boat/i);
    assert.match(YOUTH_COMPETITION_POLICY, /not added to a boat roster/i);
    for (const pattern of LEFTOVER_MAIN_STRINGER) {
      assert.equal(pattern.test(YOUTH_COMPETITION_POLICY), false);
    }
    for (const pattern of LEFTOVER_YOUTH_COUNT_TOWARD_FOUR) {
      assert.equal(pattern.test(YOUTH_COMPETITION_POLICY), false);
    }
    for (const pattern of LEFTOVER_YOUTH_ON_BOAT_REGISTER) {
      assert.equal(pattern.test(YOUTH_COMPETITION_POLICY), false);
    }
    for (const pattern of LEFTOVER_LAND_ONLY_FISHING) {
      assert.equal(pattern.test(YOUTH_COMPETITION_POLICY), false);
    }
  });
});

describe("youth main-stringer leftover copy", () => {
  it("does not say youth fish count on the main team stringer", () => {
    for (const relative of COPY_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of LEFTOVER_MAIN_STRINGER) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still matches ${pattern}`,
        );
      }
    }
  });

  it("does not require youth to occupy a boat roster seat", () => {
    for (const relative of COPY_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of LEFTOVER_BOAT_REQUIRED) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still matches ${pattern}`,
        );
      }
    }
  });

  it("does not say youth count toward the 4-adult boat cap", () => {
    for (const relative of COPY_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of LEFTOVER_YOUTH_COUNT_TOWARD_FOUR) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still matches ${pattern}`,
        );
      }
    }
  });

  it("does not invite adding kids onto a boat roster via registration", () => {
    for (const relative of COPY_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of LEFTOVER_YOUTH_ON_BOAT_REGISTER) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still matches ${pattern}`,
        );
      }
    }
  });

  it("does not say kids may only fish from land", () => {
    for (const relative of COPY_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of LEFTOVER_LAND_ONLY_FISHING) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still matches ${pattern}`,
        );
      }
    }
  });
});

const MAIN_RULES_SURFACES = [
  "docs/tournament-rules.md",
  "src/app/rules/page.tsx",
];

const YOUTH_RULES_SURFACES = [
  "docs/rowride-rules.md",
  "src/app/kids/page.tsx",
];

const LAND_OR_BOAT_SURFACES = [
  "docs/rowride-rules.md",
  "docs/tournament-rules.md",
  "src/app/kids/page.tsx",
  "src/app/rules/page.tsx",
  "src/app/register/youth/page.tsx",
  "src/components/YouthLandRegisterForm.tsx",
  "src/lib/youth.ts",
  "src/app/page.tsx",
  "src/app/pots/page.tsx",
];

const EMBEDDED_ROWRIDE_ON_MAIN = [
  /must personally hook the fish/i,
  /Little Anglers\. Big Fish/i,
  /Parent login is the login/i,
];

describe("RowRide rules live on the kids page", () => {
  it("does not embed the full youth rules in the adult boat document", () => {
    for (const relative of MAIN_RULES_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of EMBEDDED_ROWRIDE_ON_MAIN) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still embeds ${pattern}`,
        );
      }
      assert.match(text, /Kids \/ RowRide rules/);
    }
  });

  it("keeps the official youth rules on /kids and docs/rowride-rules.md", () => {
    for (const relative of YOUTH_RULES_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      assert.match(text, /must personally hook the fish/i);
      assert.match(text, /Tournament Host/);
      assert.match(text, /\/register\/youth/);
      assert.match(text, /land\s+or\s+by\s+boat/i);
      assert.match(text, /Main tournament rules|adult boat tournament rules/i);
    }
  });

  it("says kids may fish from land or by boat on public RowRide surfaces", () => {
    for (const relative of LAND_OR_BOAT_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      assert.match(
        text,
        /land\s+or\s+by\s+boat/i,
        `${relative} is missing land-or-boat`,
      );
    }
  });
});

describe("boat register form is adults only", () => {
  it("has no + Add youth or 17-or-under checkbox", () => {
    const text = readFileSync(
      join(ROOT, "src/components/RegisterForm.tsx"),
      "utf8",
    );
    assert.equal(text.includes("+ Add youth"), false);
    assert.equal(/YOUTH_CHECKBOX_LABEL/.test(text), false);
    assert.equal(/17 or under/.test(text), false);
    assert.match(text, /\/register\/youth/);
    assert.match(text, /isYouth: false/);
  });
});
