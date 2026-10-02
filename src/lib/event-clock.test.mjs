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
  it("targets Saturday, October 10, 2026 at 7:25 AM America/Chicago (Rockport sunrise)", () => {
    const parts = chicagoParts(FIRST_CAST_AT);
    assert.equal(parts.weekday, "Saturday");
    assert.deepEqual(
      {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour,
        minute: parts.minute,
        second: parts.second,
      },
      { year: 2026, month: 10, day: 10, hour: 7, minute: 25, second: 0 },
    );
    // 7:25 AM CDT (UTC−5) on Oct 10, 2026.
    assert.equal(FIRST_CAST_AT.toISOString(), "2026-10-10T12:25:00.000Z");
    assert.equal(EVENT.countdownTargetIso, FIRST_CAST_AT.toISOString());
    assert.equal(EVENT.countdownCaption, "Until first cast");
    assert.match(EVENT.countdownDetail, /Lines in/);
    assert.match(EVENT.countdownDetail, /sunrise/i);
    assert.match(EVENT.countdownDetail, /Sat Oct 10/);
    assert.doesNotMatch(EVENT.countdownDetail, /7:00 AM/);
  });

  it("counts the duration until Saturday sunrise, not Friday 7:00 AM or weigh-in", () => {
    const eveningBefore = new Date("2026-10-02T00:00:00.000Z");
    const untilFirstCast = remainingUntil(FIRST_CAST_AT, eveningBefore);
    assert.equal(untilFirstCast.days, 8);
    assert.equal(untilFirstCast.hours, 12);
    assert.equal(untilFirstCast.minutes, 25);

    const fridaySeven = chicagoWallTime({
      year: 2026,
      month: 10,
      day: 9,
      hour: 7,
    });
    const untilFriday = remainingUntil(fridaySeven, eveningBefore);
    assert.equal(untilFriday.days, 7);
    assert.equal(untilFriday.hours, 12);
    assert.notEqual(untilFirstCast.totalMs, untilFriday.totalMs);

    const weighIn = chicagoWallTime({
      year: 2026,
      month: 10,
      day: 10,
      hour: 14,
    });
    const untilWeighIn = remainingUntil(weighIn, eveningBefore);
    assert.ok(untilWeighIn.totalMs > untilFirstCast.totalMs);

    const atLinesIn = remainingUntil(FIRST_CAST_AT, FIRST_CAST_AT);
    assert.equal(atLinesIn.totalMs, 0);
    assert.equal(atLinesIn.days, 0);
  });

  it("leaves the Livewell start lock on Friday 7:00 AM, separate from first cast", () => {
    assert.equal(LIVEWELL_START_AT.toISOString(), "2026-10-09T12:00:00.000Z");
    assert.notEqual(LIVEWELL_START_AT.toISOString(), FIRST_CAST_AT.toISOString());
  });

  it("puts First cast on Saturday at sunrise and keeps Friday to the captain's meeting", () => {
    const page = readFileSync(join(ROOT, "src/app/page.tsx"), "utf8");
    assert.match(page, /EVENT\.countdownTargetIso/);
    assert.match(page, /EVENT\.countdownCaption/);
    assert.match(page, /EVENT\.countdownDetail/);

    const fridayStart = page.indexOf("Friday, October 9");
    const saturdayStart = page.indexOf("Saturday, October 10");
    assert.ok(fridayStart !== -1 && saturdayStart > fridayStart);
    const friday = page.slice(fridayStart, saturdayStart);
    const saturday = page.slice(saturdayStart);

    assert.equal(friday.includes("First cast"), false);
    assert.equal(friday.includes("7:00 AM"), false);
    assert.match(friday, /Captain/);
    assert.match(friday, /7:00 PM/);

    const firstCast = saturday.indexOf("First cast");
    const sunrise = saturday.indexOf("SUNRISE");
    assert.ok(firstCast !== -1 && sunrise > firstCast);
    assert.equal(saturday.slice(firstCast, sunrise).includes("7:00"), false);
    assert.equal(saturday.includes("Fishing hours"), false);
    assert.match(saturday, /Weigh-in/);
    assert.match(saturday, /2:00 PM/);
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
