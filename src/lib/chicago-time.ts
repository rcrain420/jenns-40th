/** America/Chicago wall time → absolute instant. Handles CST and CDT. */

const CHICAGO = "America/Chicago";

function chicagoOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  let hour = pick("hour");
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    hour,
    pick("minute"),
    pick("second"),
  );
  return asUtc - utcMs;
}

/** Build an absolute Date from a clock reading in America/Chicago. */
export function chicagoWallTime(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  second?: number;
}): Date {
  const minute = input.minute ?? 0;
  const second = input.second ?? 0;
  const wallAsUtc = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    minute,
    second,
  );
  let utc = wallAsUtc - chicagoOffsetMs(wallAsUtc);
  const adjusted = wallAsUtc - chicagoOffsetMs(utc);
  if (adjusted !== utc) utc = adjusted;
  return new Date(utc);
}

export function chicagoParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO,
    hourCycle: "h23",
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    hour,
    minute: Number(pick("minute")),
    second: Number(pick("second")),
    weekday: pick("weekday"),
  };
}
