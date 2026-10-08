import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  REDFISH_SLOT_BOARD_NOTE,
  REDFISH_SLOT_INCHES,
  REDFISH_SLOT_RULE,
} from "./config.ts";
import { YOUTH_REDFISH_SLOT_RULE } from "./youth.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const CONSTANT_SURFACES = [
  "src/app/page.tsx",
  "src/app/rules/page.tsx",
  "src/app/kids/page.tsx",
  "src/app/pots/page.tsx",
  "src/components/PotBoard.tsx",
  "src/components/WeighInConsole.tsx",
  "src/components/WeighInStandings.tsx",
  "src/components/SidePotStandings.tsx",
  "src/components/YouthDivisionAwards.tsx",
  "src/components/RegisterForm.tsx",
  "src/components/YouthLandRegisterForm.tsx",
  "src/components/AdminTeamEditor.tsx",
  "src/lib/youth.ts",
  "src/lib/weigh-scoring.ts",
];

describe("redfish slot copy", () => {
  it("keeps the Texas slot at 20 to 28 inches, inclusive", () => {
    assert.equal(REDFISH_SLOT_INCHES.min, 20);
    assert.equal(REDFISH_SLOT_INCHES.max, 28);
    assert.match(REDFISH_SLOT_RULE, /20 to 28 inches/);
    assert.match(REDFISH_SLOT_RULE, /Out-of-slot/);
    assert.match(REDFISH_SLOT_RULE, /no length/);
    assert.match(YOUTH_REDFISH_SLOT_RULE, /20 to 28 inches/);
    assert.match(REDFISH_SLOT_BOARD_NOTE, /20–28 inches/);
  });

  it("states the slot everywhere the site explains a redfish rule", () => {
    for (const relative of CONSTANT_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      assert.match(
        text,
        /REDFISH_SLOT_RULE|REDFISH_SLOT_INCHES|YOUTH_REDFISH_SLOT_RULE|REDFISH_SLOT_BOARD_NOTE/,
        `${relative} does not use the shared redfish slot`,
      );
    }

    const rules = readFileSync(join(ROOT, "docs/tournament-rules.md"), "utf8");
    assert.equal(rules.includes(REDFISH_SLOT_RULE), true);
    assert.match(rules, /Three legal slot redfish \(20–28 inches\)/);
    assert.match(rules, /slot redfish \(20–28 inches\) measuring closest to 21/);
    assert.match(rules, /outside the 20–28 inch slot does not qualify for Blackjack/);
    assert.match(rules, /slot redfish \(20–28 inches\) with the greatest number/);
    assert.equal(rules.includes(YOUTH_REDFISH_SLOT_RULE), true);

    const rowride = readFileSync(join(ROOT, "docs/rowride-rules.md"), "utf8");
    assert.equal(rowride.includes(YOUTH_REDFISH_SLOT_RULE), true);
    assert.equal(rowride.includes(REDFISH_SLOT_RULE), true);
  });
});
