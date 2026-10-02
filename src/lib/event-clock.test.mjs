import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { chicagoParts, chicagoWallTime } from "./chicago-time.ts";
import {
  EVENT,
  FIRST_CAST_AT,
  remainingUntil,
} from "./config.ts";
import { LIVEWELL_START_AT } from "./livewell-plus.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("first cast countdown", () => {
  it("targets Friday, October 9, 2026 at 7:00 AM America/Chicago", () => {
    const parts = chicagoParts(FIRST_CAST_AT);
    assert.equal(parts.weekday, "Friday");
    assert.deepEqual(
      {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour,
        minute: parts.minute,
        second: parts.second,
      },
      { year: 2026, month: 10, day: 9, hour: 7, minute: 0, second: 0 },
    );
    assert.equal(FIRST_CAST_AT.toISOString(), "2026-10-09T12:00:00.000Z");
    assert.equal(EVENT.countdownTargetIso, FIRST_CAST_AT.toISOString());
    assert.equal(EVENT.countdownCaption, "Until first cast");
    assert.match(EVENT.countdownDetail, /Lines in/);
    assert.match(EVENT.countdownDetail, /7:00 AM/);
  });

  it("counts the duration until first cast, not Saturday sunrise or weigh-in", () => {
    const eveningBefore = new Date("2026-10-02T00:00:00.000Z");
    const untilFirstCast = remainingUntil(FIRST_CAST_AT, eveningBefore);
    assert.equal(untilFirstCast.days, 7);
    assert.equal(untilFirstCast.hours, 12);
    assert.equal(untilFirstCast.minutes, 0);

    const saturdaySunrise = chicagoWallTime({
      year: 2026,
      month: 10,
      day: 10,
      hour: 7,
    });
    const untilSaturday = remainingUntil(saturdaySunrise, eveningBefore);
    assert.equal(untilSaturday.days, 8);
    assert.notEqual(untilFirstCast.days, untilSaturday.days);

    const atLinesIn = remainingUntil(FIRST_CAST_AT, FIRST_CAST_AT);
    assert.equal(atLinesIn.totalMs, 0);
    assert.equal(atLinesIn.days, 0);
  });

  it("keeps Livewell lines-in locked to the same first-cast instant", () => {
    assert.equal(LIVEWELL_START_AT.toISOString(), FIRST_CAST_AT.toISOString());
  });

  it("labels the homepage countdown as days until first cast", () => {
    const page = readFileSync(join(ROOT, "src/app/page.tsx"), "utf8");
    assert.match(page, /EVENT\.countdownTargetIso/);
    assert.match(page, /EVENT\.countdownCaption/);
    assert.match(page, /EVENT\.countdownDetail/);

    const firstCast = page.indexOf("First cast");
    const sevenAm = page.indexOf("7:00 AM");
    const sunrise = page.indexOf("SUNRISE");
    assert.ok(firstCast !== -1 && sevenAm !== -1 && sunrise !== -1);
    assert.ok(sevenAm > firstCast);
    assert.equal(page.slice(firstCast, sevenAm).includes("SUNRISE"), false);
    assert.match(page, /Fishing hours/);
  });
});

describe("America/Chicago wall time", () => {
  it("uses CDT in October and CST in January", () => {
    const octoberMidnight = chicagoWallTime({
      year: 2026,
      month: 10,
      day: 2,
      hour: 0,
    });
    assert.equal(octoberMidnight.toISOString(), "2026-10-02T05:00:00.000Z");

    const januaryMidnight = chicagoWallTime({
      year: 2026,
      month: 1,
      day: 15,
      hour: 0,
    });
    assert.equal(januaryMidnight.toISOString(), "2026-01-15T06:00:00.000Z");
  });
});
