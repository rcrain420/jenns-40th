import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { SPONSORS } from "./sponsors.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("home sponsors", () => {
  it("lists Waterloo Rod Company with a logo and official site link", () => {
    assert.equal(SPONSORS.length >= 1, true);
    const waterloo = SPONSORS.find(
      (sponsor) => sponsor.name === "Waterloo Rod Company",
    );
    assert.ok(waterloo);
    assert.equal(waterloo.logoSrc, "/sponsors/waterloo-rod-company.jpg");
    assert.equal(waterloo.href, "https://www.waterloorods.com/");
    assert.ok(
      existsSync(join(ROOT, "public/sponsors/waterloo-rod-company.jpg")),
    );
  });

  it("renders the sponsors section at the bottom of the home page, above the footer", () => {
    const home = readFileSync(join(ROOT, "src/app/page.tsx"), "utf8");
    const section = readFileSync(
      join(ROOT, "src/components/Sponsors.tsx"),
      "utf8",
    );

    assert.match(home, /import \{ Sponsors \} from "@\/components\/Sponsors"/);
    assert.match(home, /<Sponsors \/>/);
    const sponsorsIndex = home.indexOf("<Sponsors />");
    const footerIndex = home.indexOf("<footer");
    assert.ok(sponsorsIndex > -1 && footerIndex > sponsorsIndex);

    assert.match(section, /Sponsors/);
    assert.match(section, /SPONSORS\.map/);
    assert.match(section, /double-frame/);
    assert.match(section, /target="_blank"/);
    assert.match(section, /rel="noopener noreferrer"/);
  });
});
