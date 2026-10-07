/** Client-safe copy, paths, and display. No secrets and no Node built-ins. */

export const LINE_GUESS_DONATE_URL =
  "https://impact.ccalliance.org/Fightlikearedfish";

export const LINE_GUESS_MIN_DOLLARS = 40;

export const LINE_GUESS_METHOD = "CCA";

/** Generous cap so a typo cannot store millions of feet. */
export const LINE_GUESS_MAX_FEET = 100_000;

/** Whole feet or up to two decimal places. No exponents. */
export const LINE_GUESS_FEET_PATTERN = /^\d+(\.\d{1,2})?$/;

export const LINE_GUESS_DONATE_LABEL = "I donated $40";

export function lineGuessEntryPath(token: string): string {
  return `/line/${encodeURIComponent(token)}`;
}

export function lineGuessListPath(token: string): string {
  return `${lineGuessEntryPath(token)}/list`;
}

export function lineGuessEntriesPath(token: string): string {
  return `${lineGuessEntryPath(token)}/entries`;
}

export function lineGuessEntryItemPath(token: string, id: string): string {
  return `${lineGuessEntriesPath(token)}/${encodeURIComponent(id)}`;
}

export function lineGuessPinPath(token: string): string {
  return `${lineGuessEntryPath(token)}/pin`;
}

export function formatGuessFeet(feet: number): string {
  const rounded = Math.round(feet * 100) / 100;
  const text = rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${text} ft`;
}

/** Clock time in Rockport (America/Chicago), with a CT suffix. */
export function formatLineGuessTime(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${formatted} CT`;
}
