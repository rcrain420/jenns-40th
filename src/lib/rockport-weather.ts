import { chicagoParts } from "./chicago-time.ts";

/**
 * Cove Harbor / Rockport forecast for the tournament homepage.
 * Open-Meteo’s free forecast API — no key. https://open-meteo.com/
 *
 * The homepage is force-dynamic, which turns off Next.js fetch revalidation,
 * so a successful forecast is kept in memory on the server instance.
 */

export const ROCKPORT = {
  latitude: 27.9921173,
  longitude: -97.0754309,
  place: "Cove Harbor, Rockport, TX",
  timezone: "America/Chicago",
} as const;

/** Captain’s meeting, Friday evening. */
export const CAPTAINS_MEETING_DATE = "2026-10-09";
/** Fishing day, sunrise through weigh-in. */
export const FISHING_DATE = "2026-10-10";
/** Last day shown on the multi-day strip. */
export const FORECAST_WINDOW_END = "2026-10-11";

/** Successful forecasts are reused for half an hour per server instance. */
export const ROCKPORT_WEATHER_CACHE_MS = 30 * 60 * 1000;
const FAILURE_COOLDOWN_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;
/** Open-Meteo’s forecast horizon is 16 days, including today. */
const HORIZON_DAYS = 15;
const MAX_CONTINUOUS_DAYS = 6;

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

const WEATHER_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export type RockportCurrent = {
  temperatureF: number | null;
  condition: string | null;
  windMph: number | null;
  windDirection: string | null;
  rainPercent: number | null;
};

export type RockportDay = {
  date: string;
  weekday: string;
  dateLabel: string;
  badge: string | null;
  windowLabel: string;
  highlighted: boolean;
  highF: number | null;
  lowF: number | null;
  condition: string | null;
  windMph: number | null;
  windGustMph: number | null;
  windDirection: string | null;
  rainPercent: number | null;
  precipInches: number | null;
  sunrise: string | null;
  sunset: string | null;
};

export type RockportForecast = {
  place: string;
  timezone: string;
  summary: string;
  current: RockportCurrent | null;
  days: RockportDay[];
};

type HourSample = {
  time: string;
  hour: number;
  temp: number | null;
  code: number | null;
  pop: number | null;
  precip: number | null;
  wind: number | null;
  dir: number | null;
  gust: number | null;
};

type CacheEntry = {
  expiresAt: number;
  value: RockportForecast;
};

let successCache: CacheEntry | null = null;
let failureUntil = 0;

export function clearRockportWeatherCache(): void {
  successCache = null;
  failureUntil = 0;
}

/** Test hook: keep the last forecast, but make the next read treat it as stale. */
export function expireRockportWeatherCache(): void {
  if (successCache) successCache = { ...successCache, expiresAt: 0 };
}

export function chicagoIsoDate(date: Date): string {
  const parts = chicagoParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function compassLabel(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS[index] ?? "N";
}

export function describeWeatherCode(code: number): string {
  return WEATHER_LABELS[code] ?? "Changing conditions";
}

export function formatClock(isoLocal: string | null): string | null {
  if (!isoLocal) return null;
  const match = /T(\d{2}):(\d{2})/.exec(isoLocal);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isInteger(hour) || minute == null) return null;
  const suffix = hour >= 12 ? "PM" : "AM";
  hour %= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}

export function formatWind(
  mph: number | null,
  direction: string | null,
  gustMph: number | null = null,
): string | null {
  if (mph == null) return null;
  const directionLabel = direction ? ` ${direction}` : "";
  const gustLabel = gustMph != null ? ` · gusts ${gustMph}` : "";
  return `Wind ${mph} mph${directionLabel}${gustLabel}`;
}

export function formatRain(percent: number | null, inches: number | null): string | null {
  const parts: string[] = [];
  if (percent != null) parts.push(`${percent}% rain`);
  if (inches != null && inches >= 0.01) parts.push(`${inches.toFixed(2)} in`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatCurrent(current: RockportCurrent): string | null {
  const bits: string[] = [];
  if (current.temperatureF != null) bits.push(`${current.temperatureF}°`);
  if (current.condition) bits.push(current.condition);
  const wind = formatWind(current.windMph, current.windDirection);
  if (wind) bits.push(wind);
  const rain = formatRain(current.rainPercent, null);
  if (rain) bits.push(rain);
  if (bits.length === 0) return null;
  return `Right now · ${bits.join(" · ")}`;
}

export function forecastSummary(dates: string[]): string {
  const hasMeeting = dates.includes(CAPTAINS_MEETING_DATE);
  const hasFishing = dates.includes(FISHING_DATE);
  if (hasMeeting && hasFishing) {
    return "Friday evening is the captain’s meeting. Saturday covers sunrise through the 2:00 PM weigh-in.";
  }
  if (hasFishing) {
    return "Saturday covers sunrise through the 2:00 PM weigh-in.";
  }
  if (hasMeeting) {
    return "Friday evening is the captain’s meeting.";
  }
  return "Current conditions around Cove Harbor.";
}

export function selectForecastDates(today: string): string[] {
  if (!parseIsoDate(today)) return [];
  if (today > FORECAST_WINDOW_END) return [today];

  const horizonEnd = addDays(today, HORIZON_DAYS);
  const end = FORECAST_WINDOW_END <= horizonEnd ? FORECAST_WINDOW_END : horizonEnd;
  const span = eachDate(today, end);
  if (span.length <= MAX_CONTINUOUS_DAYS) return span;

  const pinned = [CAPTAINS_MEETING_DATE, FISHING_DATE, FORECAST_WINDOW_END].filter(
    (date) => date > today && date <= horizonEnd,
  );
  if (pinned.length === 0) return eachDate(today, addDays(today, 2));
  return [today, ...pinned];
}

export function openMeteoForecastUrl(dates: string[]): string | null {
  const start = dates[0];
  const end = dates[dates.length - 1];
  if (!start || !end) return null;
  const params = new URLSearchParams({
    latitude: String(ROCKPORT.latitude),
    longitude: String(ROCKPORT.longitude),
    timezone: ROCKPORT.timezone,
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    current: [
      "temperature_2m",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "precipitation",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
      "precipitation",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "wind_direction_10m_dominant",
      "sunrise",
      "sunset",
    ].join(","),
    start_date: start,
    end_date: end,
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function buildForecast(
  payload: unknown,
  today: string,
  dates: string[],
): RockportForecast | null {
  const record = asRecord(payload);
  if (!record) return null;
  const samples = hourlySamples(record);
  const days = dates
    .map((date) => buildDay(record, samples, date, today))
    .filter((day): day is RockportDay => day != null);
  if (days.length === 0) return null;
  return {
    place: ROCKPORT.place,
    timezone: ROCKPORT.timezone,
    summary: forecastSummary(days.map((day) => day.date)),
    current: buildCurrent(record, samples),
    days,
  };
}

export async function fetchOpenMeteoForecast(
  now: Date = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<RockportForecast | null> {
  try {
    const today = chicagoIsoDate(now);
    const dates = selectForecastDates(today);
    const url = openMeteoForecastUrl(dates);
    if (!url) return null;
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    return buildForecast(payload, today, dates);
  } catch {
    return null;
  }
}

export async function loadRockportForecast(options?: {
  now?: Date;
  fetchImpl?: typeof fetch;
  cache?: boolean;
}): Promise<RockportForecast | null> {
  try {
    const fetchImpl = options?.fetchImpl ?? fetch;
    const useCache = options?.cache ?? fetchImpl === fetch;
    const nowMs = Date.now();
    if (useCache && successCache && successCache.expiresAt > nowMs) {
      return successCache.value;
    }
    if (useCache && nowMs < failureUntil) {
      return successCache?.value ?? null;
    }

    const forecast = await fetchOpenMeteoForecast(options?.now ?? new Date(), fetchImpl);
    if (!forecast) {
      if (useCache) failureUntil = Date.now() + FAILURE_COOLDOWN_MS;
      return successCache?.value ?? null;
    }
    if (useCache) {
      successCache = {
        expiresAt: Date.now() + ROCKPORT_WEATHER_CACHE_MS,
        value: forecast,
      };
      failureUntil = 0;
    }
    return forecast;
  } catch {
    return successCache?.value ?? null;
  }
}

function buildCurrent(
  payload: Record<string, unknown>,
  samples: HourSample[],
): RockportCurrent | null {
  const current = asRecord(payload.current);
  if (!current) return null;
  const temperature = finiteNumber(current.temperature_2m);
  const code = finiteNumber(current.weather_code);
  const wind = finiteNumber(current.wind_speed_10m);
  const direction = finiteNumber(current.wind_direction_10m);
  if (temperature == null && code == null && wind == null) return null;

  const time = typeof current.time === "string" ? current.time : null;
  const match = time
    ? samples.find((sample) => sample.time.startsWith(time.slice(0, 13)))
    : undefined;

  return {
    temperatureF: roundTemp(temperature),
    condition: code == null ? null : describeWeatherCode(code),
    windMph: wind == null ? null : Math.round(wind),
    windDirection: direction == null ? null : compassLabel(direction),
    rainPercent: match?.pop == null ? null : Math.round(match.pop),
  };
}

function buildDay(
  payload: Record<string, unknown>,
  samples: HourSample[],
  date: string,
  today: string,
): RockportDay | null {
  const dailyHit = dailyAt(payload, date);
  const daySamples = samples.filter((sample) => sample.time.startsWith(date));
  if (!dailyHit && daySamples.length === 0) return null;

  const window = hourWindow(date);
  const windowed = daySamples.filter(
    (sample) => sample.hour >= window.start && sample.hour <= window.end,
  );
  const focused = windowed.length > 0 ? windowed : daySamples;

  const code =
    worstCode(numbers(focused.map((sample) => sample.code))) ??
    dailyNumber(dailyHit, "weather_code");
  const rainPercent =
    maxNumber(numbers(focused.map((sample) => sample.pop))) ??
    roundTemp(dailyNumber(dailyHit, "precipitation_probability_max"));
  const precipInches =
    sumInches(numbers(focused.map((sample) => sample.precip))) ??
    roundInches(dailyNumber(dailyHit, "precipitation_sum"));
  const wind = summarizeWind(focused) ?? dailyWind(dailyHit);
  const temps = numbers(focused.map((sample) => sample.temp));

  const sunrise =
    date === FISHING_DATE ? formatClock(dailyString(dailyHit, "sunrise")) : null;
  const sunset =
    date === FISHING_DATE ? formatClock(dailyString(dailyHit, "sunset")) : null;

  return {
    date,
    weekday: formatWeekday(date),
    dateLabel: formatDateLabel(date),
    badge: badgeFor(date, today),
    windowLabel: windowLabel(date),
    highlighted: date === CAPTAINS_MEETING_DATE || date === FISHING_DATE,
    highF: roundTemp(dailyNumber(dailyHit, "temperature_2m_max") ?? maxNumber(temps)),
    lowF: roundTemp(dailyNumber(dailyHit, "temperature_2m_min") ?? minNumber(temps)),
    condition: code == null ? null : describeWeatherCode(code),
    windMph: wind?.mph ?? null,
    windGustMph: wind?.gust ?? null,
    windDirection: wind?.direction ?? null,
    rainPercent: rainPercent == null ? null : Math.round(rainPercent),
    precipInches,
    sunrise,
    sunset,
  };
}

function summarizeWind(
  samples: HourSample[],
): { mph: number; gust: number | null; direction: string | null } | null {
  const withWind = samples.filter(
    (sample): sample is HourSample & { wind: number; dir: number } =>
      sample.wind != null && sample.dir != null,
  );
  if (withWind.length === 0) return null;

  const average = withWind.reduce((sum, sample) => sum + sample.wind, 0) / withWind.length;
  let east = 0;
  let north = 0;
  let gust = 0;
  let sawGust = false;
  for (const sample of withWind) {
    const radians = (sample.dir * Math.PI) / 180;
    const weight = Math.max(sample.wind, 0.1);
    east += Math.sin(radians) * weight;
    north += Math.cos(radians) * weight;
    if (sample.gust != null) {
      sawGust = true;
      if (sample.gust > gust) gust = sample.gust;
    }
  }
  const mph = Math.round(average);
  const gustMph = sawGust ? Math.round(gust) : null;
  const degrees = (Math.atan2(east, north) * 180) / Math.PI;
  return {
    mph,
    gust: gustMph != null && gustMph >= mph + 5 ? gustMph : null,
    direction: compassLabel((degrees + 360) % 360),
  };
}

function dailyWind(
  dailyHit: { daily: Record<string, unknown>; index: number } | null,
): { mph: number; gust: number | null; direction: string | null } | null {
  const mphRaw = dailyNumber(dailyHit, "wind_speed_10m_max");
  if (mphRaw == null) return null;
  const mph = Math.round(mphRaw);
  const gustRaw = dailyNumber(dailyHit, "wind_gusts_10m_max");
  const gust = gustRaw == null ? null : Math.round(gustRaw);
  const directionRaw = dailyNumber(dailyHit, "wind_direction_10m_dominant");
  return {
    mph,
    gust: gust != null && gust >= mph + 5 ? gust : null,
    direction: directionRaw == null ? null : compassLabel(directionRaw),
  };
}

function hourWindow(date: string): { start: number; end: number } {
  if (date === CAPTAINS_MEETING_DATE) return { start: 17, end: 21 };
  if (date === FISHING_DATE) return { start: 7, end: 15 };
  return { start: 7, end: 19 };
}

function windowLabel(date: string): string {
  if (date === CAPTAINS_MEETING_DATE) return "Evening · 5–9 PM";
  if (date === FISHING_DATE) return "7 AM–3 PM";
  return "Daytime";
}

function badgeFor(date: string, today: string): string | null {
  if (date === CAPTAINS_MEETING_DATE) return "Captain's meeting";
  if (date === FISHING_DATE) return "Fishing day";
  if (date === today) return "Today";
  return null;
}

function hourlySamples(payload: Record<string, unknown>): HourSample[] {
  const hourly = asRecord(payload.hourly);
  if (!hourly) return [];
  const times = asArray(hourly.time);
  if (!times) return [];
  const temps = asArray(hourly.temperature_2m);
  const codes = asArray(hourly.weather_code);
  const pops = asArray(hourly.precipitation_probability);
  const precips = asArray(hourly.precipitation);
  const winds = asArray(hourly.wind_speed_10m);
  const dirs = asArray(hourly.wind_direction_10m);
  const gusts = asArray(hourly.wind_gusts_10m);

  const samples: HourSample[] = [];
  times.forEach((time, index) => {
    if (typeof time !== "string") return;
    const hour = Number(time.slice(11, 13));
    if (!Number.isInteger(hour)) return;
    samples.push({
      time,
      hour,
      temp: numAt(temps, index),
      code: numAt(codes, index),
      pop: numAt(pops, index),
      precip: numAt(precips, index),
      wind: numAt(winds, index),
      dir: numAt(dirs, index),
      gust: numAt(gusts, index),
    });
  });
  return samples;
}

function dailyAt(
  payload: Record<string, unknown>,
  date: string,
): { daily: Record<string, unknown>; index: number } | null {
  const daily = asRecord(payload.daily);
  if (!daily) return null;
  const times = asArray(daily.time);
  if (!times) return null;
  const index = times.findIndex((time) => time === date);
  if (index < 0) return null;
  return { daily, index };
}

function dailyNumber(
  hit: { daily: Record<string, unknown>; index: number } | null,
  key: string,
): number | null {
  if (!hit) return null;
  return numAt(asArray(hit.daily[key]), hit.index);
}

function dailyString(
  hit: { daily: Record<string, unknown>; index: number } | null,
  key: string,
): string | null {
  if (!hit) return null;
  const list = asArray(hit.daily[key]);
  if (!list || hit.index >= list.length) return null;
  const value = list[hit.index];
  return typeof value === "string" ? value : null;
}

function worstCode(codes: number[]): number | null {
  if (codes.length === 0) return null;
  return codes.reduce((worst, code) =>
    codeSeverity(code) > codeSeverity(worst) ? code : worst,
  );
}

function codeSeverity(code: number): number {
  if (code >= 95) return 100;
  if (code >= 80) return 80;
  if (code >= 71) return 75;
  if (code >= 61) return 70;
  if (code >= 51) return 60;
  if (code === 45 || code === 48) return 40;
  if (code === 3) return 20;
  if (code === 2) return 10;
  if (code === 1) return 5;
  return 0;
}

function numbers(values: Array<number | null>): number[] {
  return values.filter((value): value is number => value != null);
}

function maxNumber(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

function minNumber(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.min(...values);
}

function sumInches(values: number[]): number | null {
  if (values.length === 0) return null;
  return roundInches(values.reduce((sum, value) => sum + value, 0));
}

function eachDate(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end && dates.length < 16) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function addDays(iso: string, days: number): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  const utc = new Date(Date.UTC(parts.y, parts.m - 1, parts.d + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function formatWeekday(iso: string): string {
  const date = utcNoon(iso);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatDateLabel(iso: string): string {
  const date = utcNoon(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function utcNoon(iso: string): Date | null {
  const parts = parseIsoDate(iso);
  if (!parts) return null;
  return new Date(Date.UTC(parts.y, parts.m - 1, parts.d));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function numAt(list: unknown[] | null, index: number): number | null {
  if (!list || index < 0 || index >= list.length) return null;
  return finiteNumber(list[index]);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundTemp(value: number | null): number | null {
  if (value == null) return null;
  return Math.round(value);
}

function roundInches(value: number | null): number | null {
  if (value == null) return null;
  return Math.round(value * 100) / 100;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
