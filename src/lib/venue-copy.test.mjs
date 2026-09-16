import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { EVENT } from "./config.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const COPY_SURFACES = [
  "README.md",
  "docs/tournament-rules.md",
  "docs/rowride-rules.md",
  "src/lib/config.ts",
  "src/lib/team-name-ai.ts",
  "src/app/page.tsx",
  "src/app/rules/page.tsx",
  "src/app/kids/page.tsx",
  "src/app/register/page.tsx",
  "src/app/register/youth/page.tsx",
  "src/app/register/success/page.tsx",
  "src/app/catches/page.tsx",
  "src/app/layout.tsx",
  "src/lib/registration-email.test.mjs",
  "src/lib/captain-invite-email-copy.test.mjs",
  "src/lib/team-invite-email.test.mjs",
  "src/lib/angler-join-invites.test.mjs",
];

/** Aaron 2026-09-16: weigh-in is Boatman’s Knot, not Boatmen’s Club Bar & Marina. */
const LEFTOVER_VENUE = [
  /Boatmen/i,
  /Boatmen['’]?s Club/i,
  /Boatmens Club/i,
  /Club Bar/i,
  /Bar\s*(&|&amp;|and)\s*Marina/i,
  /Boatmen['’]?s weigh-in/i,
  /Being near Boatmen/i,
];

describe("weigh-in venue leftover copy", () => {
  it("names Boatman’s Knot as the official venue", () => {
    assert.equal(EVENT.venue, "Boatman’s Knot");
    assert.match(EVENT.locationLabel, /Boatman['’]s Knot/);
    assert.match(EVENT.address, /140 Cove Harbor N, Rockport, TX 78382/);
    assert.match(EVENT.directionsUrl, /Boatman/);
    assert.equal(/Boatmen/i.test(EVENT.venue), false);
    assert.equal(/Club Bar/i.test(EVENT.venue), false);
    assert.equal(/Marina/i.test(EVENT.venue), false);
  });

  it("does not keep Boatmen’s Club Bar & Marina on public surfaces", () => {
    for (const relative of COPY_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of LEFTOVER_VENUE) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still matches ${pattern}`,
        );
      }
    }
  });

  it("keeps the Cove Harbor pin and pier walk guidance", () => {
    assert.match(EVENT.mapEmbedUrl, /marker=27\.9921173%2C-97\.0754309/);
    const home = readFileSync(join(ROOT, "src/app/page.tsx"), "utf8");
    assert.match(home, /140 Cove Harbor N/);
    assert.match(home, /Park at Cove Harbor and walk to the dock/);
    assert.match(home, /Weigh-in is at the end of/);
    assert.match(home, /EVENT\.venue/);
    const kids = readFileSync(join(ROOT, "src/app/kids/page.tsx"), "utf8");
    assert.match(kids, /EVENT\.venue/);
    const rules = readFileSync(join(ROOT, "src/app/rules/page.tsx"), "utf8");
    assert.match(rules, /Being near \{EVENT\.venue\}/);
  });
});
