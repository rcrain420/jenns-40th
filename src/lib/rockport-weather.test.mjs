import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildForecast,
  chicagoIsoDate,
  clearRockportWeatherCache,
  compassLabel,
  expireRockportWeatherCache,
  fetchOpenMeteoForecast,
  formatClock,
  formatCurrent,
  formatRain,
  formatWind,
  loadRockportForecast,
  selectForecastDates,
} from "./rockport-weather.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const NOON_OCT_7 = new Date("2026-10-07T17:00:00.000Z");

describe("Rockport forecast dates", () => {
  it("uses America/Chicago for the calendar day", () => {
    assert.equal(chicagoIsoDate(new Date("2026-10-07T05:30:00.000Z")), "2026-10-07");
    assert.equal(chicagoIsoDate(new Date("2026-10-07T04:30:00.000Z")), "2026-10-06");
  });

  it("shows today through Sunday when the tournament window is close", () => {
    assert.deepEqual(selectForecastDates("2026-10-07"), [
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    assert.deepEqual(selectForecastDates("2026-10-10"), ["2026-10-10", "2026-10-11"]);
  });

  it("keeps today plus the tournament days when the span is longer than a week", () => {
    assert.deepEqual(selectForecastDates("2026-09-28"), [
      "2026-09-28",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });

  it("stays inside the forecast horizon before the weekend is predictable", () => {
    assert.deepEqual(selectForecastDates("2026-09-01"), [
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("shows the current day after the tournament window", () => {
    assert.deepEqual(selectForecastDates("2026-10-12"), ["2026-10-12"]);
    assert.deepEqual(selectForecastDates("not-a-date"), []);
  });
});

describe("Rockport forecast parsing", () => {
  it("labels compass points and clocks", () => {
    assert.equal(compassLabel(0), "N");
    assert.equal(compassLabel(55), "NE");
    assert.equal(compassLabel(75), "ENE");
    assert.equal(compassLabel(10), "N");
    assert.equal(formatClock("2026-10-10T07:25"), "7:25 AM");
    assert.equal(formatClock("2026-10-10T19:04"), "7:04 PM");
    assert.equal(formatWind(18, "ENE", 24), "Wind 18 mph ENE · gusts 24");
    assert.equal(formatRain(9, 0), "9% rain");
    assert.equal(formatRain(40, 0.4), "40% rain · 0.40 in");
  });

  it("uses Friday evening and Saturday fishing hours, not the daily max wind", () => {
    const forecast = buildForecast(samplePayload(), "2026-10-07", [
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    assert.ok(forecast);
    assert.equal(
      forecast.summary,
      "Friday evening is the captain’s meeting. Saturday covers sunrise through the 2:00 PM weigh-in.",
    );
    assert.equal(
      formatCurrent(forecast.current),
      "Right now · 77° · Clear · Wind 7 mph NE",
    );

    const friday = forecast.days.find((day) => day.date === "2026-10-09");
    assert.ok(friday);
    assert.equal(friday.badge, "Captain's meeting");
    assert.equal(friday.highlighted, true);
    assert.equal(friday.condition, "Clear");
    assert.equal(friday.highF, 82);
    assert.equal(friday.lowF, 78);
    assert.equal(formatWind(friday.windMph, friday.windDirection, friday.windGustMph), "Wind 18 mph ENE · gusts 24");
    assert.equal(formatRain(friday.rainPercent, friday.precipInches), "9% rain");
    assert.equal(friday.sunrise, null);
    assert.equal(friday.windowLabel, "Evening · 5–9 PM");

    const saturday = forecast.days.find((day) => day.date === "2026-10-10");
    assert.ok(saturday);
    assert.equal(saturday.badge, "Fishing day");
    assert.equal(saturday.condition, "Clear");
    assert.equal(saturday.highF, 84);
    assert.equal(saturday.lowF, 76);
    assert.equal(formatWind(saturday.windMph, saturday.windDirection, saturday.windGustMph), "Wind 11 mph N");
    assert.equal(saturday.sunrise, "7:25 AM");
    assert.equal(saturday.sunset, "7:04 PM");
    assert.equal(saturday.windowLabel, "7 AM–3 PM");

    const wednesday = forecast.days.find((day) => day.date === "2026-10-07");
    assert.ok(wednesday);
    assert.equal(wednesday.badge, "Today");
    assert.equal(wednesday.condition, "Overcast");
    assert.equal(wednesday.windMph, 12);
    assert.equal(wednesday.highlighted, false);
  });

  it("returns null for an empty payload", () => {
    assert.equal(buildForecast({}, "2026-10-07", ["2026-10-07"]), null);
    assert.equal(buildForecast(null, "2026-10-07", ["2026-10-07"]), null);
  });
});

describe("Open-Meteo fetch", () => {
  it("returns null when the forecast service fails", async () => {
    const thrown = await fetchOpenMeteoForecast(NOON_OCT_7, async () => {
      throw new Error("down");
    });
    assert.equal(thrown, null);

    const httpError = await fetchOpenMeteoForecast(NOON_OCT_7, async () => ({
      ok: false,
      json: async () => ({}),
    }));
    assert.equal(httpError, null);
  });

  it("requests Cove Harbor in Fahrenheit and miles per hour", async () => {
    let url = "";
    const forecast = await fetchOpenMeteoForecast(NOON_OCT_7, async (input) => {
      url = String(input);
      return {
        ok: true,
        json: async () => samplePayload(),
      };
    });
    assert.match(url, /latitude=27\.9921173/);
    assert.match(url, /longitude=-97\.0754309/);
    assert.match(url, /timezone=America%2FChicago/);
    assert.match(url, /temperature_unit=fahrenheit/);
    assert.match(url, /wind_speed_unit=mph/);
    assert.match(url, /start_date=2026-10-07/);
    assert.match(url, /end_date=2026-10-11/);
    assert.equal(forecast?.days.length, 5);
  });

  it("reuses a successful forecast and keeps it if a refresh fails", async () => {
    clearRockportWeatherCache();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) {
        return { ok: true, json: async () => samplePayload() };
      }
      throw new Error("down");
    };
    const first = await loadRockportForecast({
      now: NOON_OCT_7,
      fetchImpl,
      cache: true,
    });
    const cached = await loadRockportForecast({
      now: NOON_OCT_7,
      fetchImpl,
      cache: true,
    });
    expireRockportWeatherCache();
    const stale = await loadRockportForecast({
      now: NOON_OCT_7,
      fetchImpl,
      cache: true,
    });
    assert.equal(calls, 2);
    assert.equal(cached?.days[0]?.date, first?.days[0]?.date);
    assert.equal(stale?.days[0]?.date, first?.days[0]?.date);
    clearRockportWeatherCache();
  });
});

describe("homepage weather placement", () => {
  it("renders the forecast with the schedule and leaves the rest of the page", () => {
    const page = readFileSync(join(ROOT, "src/app/page.tsx"), "utf8");
    const weather = page.indexOf("<RockportWeather");
    const friday = page.indexOf("Friday, October 9");
    const facts = page.indexOf("Facts strip");
    assert.ok(friday > -1 && weather > friday && facts > weather);
    assert.match(page, /loadRockportForecast\(/);
    assert.match(page, /RockportWeatherFallback/);

    const component = readFileSync(
      join(ROOT, "src/components/RockportWeather.tsx"),
      "utf8",
    );
    assert.match(component, /Rockport weather/);
    assert.match(component, /Open-Meteo/);
    assert.match(component, /isn’t available right now/);
  });
});

function samplePayload() {
  const days = [
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
    "2026-10-11",
  ];
  const points = [
    ["2026-10-09T12:00", 63, 40, 30, 180, 40, 0.4],
    ["2026-10-09T19:00", 0, 9, 18, 75, 24, 0],
    ["2026-10-10T08:00", 0, 5, 11, 10, 12, 0],
  ];
  return {
    current: {
      time: "2026-10-07T12:00",
      temperature_2m: 77.4,
      weather_code: 0,
      wind_speed_10m: 6.9,
      wind_direction_10m: 55,
    },
    hourly: {
      time: points.map((point) => point[0]),
      weather_code: points.map((point) => point[1]),
      precipitation_probability: points.map((point) => point[2]),
      wind_speed_10m: points.map((point) => point[3]),
      wind_direction_10m: points.map((point) => point[4]),
      wind_gusts_10m: points.map((point) => point[5]),
      precipitation: points.map((point) => point[6]),
      temperature_2m: points.map(() => 80),
    },
    daily: {
      time: days,
      weather_code: [3, 3, 51, 0, 0],
      temperature_2m_max: [85.6, 87.2, 82.3, 83.5, 82.1],
      temperature_2m_min: [73.8, 75.8, 78.1, 76.1, 78.5],
      precipitation_probability_max: [4, 5, 40, 6, 4],
      precipitation_sum: [0, 0, 0.4, 0, 0],
      wind_speed_10m_max: [12, 16, 40, 30, 13],
      wind_gusts_10m_max: [20, 22, 50, 35, 18],
      wind_direction_10m_dominant: [56, 70, 180, 270, 101],
      sunrise: days.map((day, index) =>
        index === 3 ? "2026-10-10T07:25" : `${day}T07:24`,
      ),
      sunset: [
        "2026-10-07T19:07",
        "2026-10-08T19:06",
        "2026-10-09T19:05",
        "2026-10-10T19:04",
        "2026-10-11T19:03",
      ],
    },
  };
}
