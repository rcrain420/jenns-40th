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
  "src/app/kids/page.tsx",
  "src/app/rules/page.tsx",
  "src/app/page.tsx",
  "src/app/pots/page.tsx",
  "src/app/teams/page.tsx",
  "src/components/RegisterForm.tsx",
  "src/components/CatchLogger.tsx",
  "src/components/TeamRosterEditor.tsx",
  "src/lib/register-form-copy.ts",
];

const LEFTOVER_MAIN_STRINGER = [
  /still count on the team stringer/i,
  /youth fish still count/i,
  /their fish still count on the team stringer/i,
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
    assert.match(YOUTH_COMPETITION_POLICY, /paid team side pots/i);
    assert.match(YOUTH_COMPETITION_POLICY, /RowRide Youth Angler Tournament/i);
    for (const pattern of LEFTOVER_MAIN_STRINGER) {
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
});
