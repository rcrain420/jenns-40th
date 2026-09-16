import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { getGaMeasurementId } from "./ga.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("getGaMeasurementId", () => {
  it("returns null when neither env var is set", () => {
    assert.equal(getGaMeasurementId({}), null);
    assert.equal(getGaMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "" }), null);
    assert.equal(getGaMeasurementId({ NEXT_PUBLIC_GA_ID: "   " }), null);
  });

  it("accepts NEXT_PUBLIC_GA_MEASUREMENT_ID when it looks like G-…", () => {
    assert.equal(
      getGaMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "  G-ABC12DEF  " }),
      "G-ABC12DEF",
    );
  });

  it("accepts NEXT_PUBLIC_GA_ID as a fallback", () => {
    assert.equal(
      getGaMeasurementId({ NEXT_PUBLIC_GA_ID: "G-FALLBACK1" }),
      "G-FALLBACK1",
    );
  });

  it("prefers MEASUREMENT_ID when both are valid", () => {
    assert.equal(
      getGaMeasurementId({
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-PRIMARY01",
        NEXT_PUBLIC_GA_ID: "G-FALLBACK1",
      }),
      "G-PRIMARY01",
    );
  });

  it("falls back to GA_ID when MEASUREMENT_ID is present but invalid", () => {
    assert.equal(
      getGaMeasurementId({
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "UA-123456-1",
        NEXT_PUBLIC_GA_ID: "G-FALLBACK1",
      }),
      "G-FALLBACK1",
    );
  });

  it("rejects leftover UA, GTM, and bare G- values", () => {
    assert.equal(getGaMeasurementId({ NEXT_PUBLIC_GA_ID: "UA-123456-1" }), null);
    assert.equal(getGaMeasurementId({ NEXT_PUBLIC_GA_ID: "GTM-XXXX" }), null);
    assert.equal(getGaMeasurementId({ NEXT_PUBLIC_GA_ID: "G-" }), null);
    assert.equal(getGaMeasurementId({ NEXT_PUBLIC_GA_ID: "G-ABC 12" }), null);
    assert.equal(getGaMeasurementId({ NEXT_PUBLIC_GA_ID: "not-a-ga-id" }), null);
  });

  it("reads process.env when no override is passed", () => {
    const prevMeasure = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const prevId = process.env.NEXT_PUBLIC_GA_ID;
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    process.env.NEXT_PUBLIC_GA_ID = "G-FROMENV1";
    try {
      assert.equal(getGaMeasurementId(), "G-FROMENV1");
    } finally {
      if (prevMeasure === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = prevMeasure;
      if (prevId === undefined) delete process.env.NEXT_PUBLIC_GA_ID;
      else process.env.NEXT_PUBLIC_GA_ID = prevId;
    }
  });
});

describe("root layout GA leftover-copy / smoke", () => {
  const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
  const helper = readFileSync(join(ROOT, "src/lib/ga.ts"), "utf8");

  it("wires @next/third-parties GoogleAnalytics only when an id is present", () => {
    assert.match(layout, /from ["']@next\/third-parties\/google["']/);
    assert.match(layout, /GoogleAnalytics/);
    assert.match(layout, /getGaMeasurementId/);
    assert.match(layout, /gaId\s*\?\s*<GoogleAnalytics\s+gaId=\{gaId\}/);
    assert.equal(/<GoogleAnalytics[\s\S]*gaId=["']G-/.test(layout), false);
  });

  it("does not hardcode a measurement id or leftover UA/GTM snippet", () => {
    for (const text of [layout, helper]) {
      assert.equal(/["'`]G-[A-Z0-9]{4,}["'`]/.test(text), false);
      assert.equal(/\bUA-\d/.test(text), false);
      assert.equal(/\bGTM-[A-Z0-9]+/.test(text), false);
      assert.equal(/googletagmanager\.com\/gtag\/js\?id=/.test(text), false);
    }
  });
});
