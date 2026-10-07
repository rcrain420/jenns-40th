import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  LINE_GUESS_DONATE_LABEL,
  LINE_GUESS_FEET_PATTERN,
  LINE_GUESS_MAX_FEET,
} from "./line-guess-format.ts";

export {
  LINE_GUESS_DONATE_LABEL,
  LINE_GUESS_DONATE_URL,
  LINE_GUESS_FEET_PATTERN,
  LINE_GUESS_MAX_FEET,
  LINE_GUESS_METHOD,
  LINE_GUESS_MIN_DOLLARS,
  formatGuessFeet,
  formatLineGuessTime,
  lineGuessEntriesPath,
  lineGuessEntryItemPath,
  lineGuessEntryPath,
  lineGuessListPath,
  lineGuessPinPath,
} from "./line-guess-format.ts";

/** Long enough that it cannot collide with 10–16 character /j/ invite codes. */
const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;
const PIN_RE = /^\d{4,8}$/;
const ID_RE = /^c[a-z0-9]{20,30}$/;

const PIN_FAIL_LIMIT = 8;
const PIN_FAIL_WINDOW_MS = 5 * 60 * 1000;

type PinFailure = { count: number; windowEndsAt: number };

const pinFailures = new Map<string, PinFailure>();

let warnedEnv = false;

function warnInvalidLineGuessEnv(): void {
  if (warnedEnv) return;
  warnedEnv = true;
  const token = process.env.LINE_GUESS_PATH_TOKEN?.trim() ?? "";
  if (token && !TOKEN_RE.test(token)) {
    console.error(
      "[line-guess] LINE_GUESS_PATH_TOKEN must be 20–128 letters, numbers, _ or -",
    );
  }
  const pin = process.env.LINE_GUESS_PIN?.trim() ?? "";
  if (pin && !PIN_RE.test(pin)) {
    console.error("[line-guess] LINE_GUESS_PIN must be 4–8 digits");
  }
}

export function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Stable production path segment. Missing or short values keep the page at 404. */
export function lineGuessPathToken(): string | null {
  warnInvalidLineGuessEnv();
  const token = process.env.LINE_GUESS_PATH_TOKEN?.trim() ?? "";
  if (!TOKEN_RE.test(token)) return null;
  return token;
}

export function lineGuessTokenMatches(token: string): boolean {
  const expected = lineGuessPathToken();
  if (!expected) return false;
  return secretsMatch(token, expected);
}

export type LineGuessPinStatus = "ok" | "missing" | "invalid";

export function lineGuessPinStatus(): LineGuessPinStatus {
  warnInvalidLineGuessEnv();
  const pin = process.env.LINE_GUESS_PIN?.trim() ?? "";
  if (!pin) return "missing";
  if (!PIN_RE.test(pin)) return "invalid";
  return "ok";
}

export function lineGuessPin(): string | null {
  if (lineGuessPinStatus() !== "ok") return null;
  return process.env.LINE_GUESS_PIN?.trim() ?? null;
}

export function isLineGuessId(id: string): boolean {
  return ID_RE.test(id);
}

function atMostTwoDecimals(n: number): boolean {
  if (!Number.isFinite(n)) return false;
  return Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;
}

const feetSchema = z
  .number({ error: "Enter the guess in feet" })
  .gt(0, "Guess must be more than 0 feet")
  .max(LINE_GUESS_MAX_FEET, "That guess is too large")
  .refine(atMostTwoDecimals, "Use at most two decimal places");

export const lineGuessEntrySchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, "Name is required")
        .max(80, "Keep the name under 80 characters"),
    ),
  guessFeet: z.preprocess((value) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!LINE_GUESS_FEET_PATTERN.test(trimmed)) return value;
    return Number(trimmed);
  }, feetSchema),
  paidClaimed: z.literal(true, {
    error: `Check “${LINE_GUESS_DONATE_LABEL}” before saving`,
  }),
  note: z.preprocess(
    (value) => (value == null ? undefined : value),
    z
      .string({ error: "Note must be text" })
      .trim()
      .max(240, "Keep the note under 240 characters")
      .optional()
      .transform((value) => (value ? value : undefined)),
  ),
});

export type LineGuessEntryInput = z.infer<typeof lineGuessEntrySchema>;

export const lineGuessPaidClaimSchema = z.object({
  paidClaimed: z.boolean({ error: "Paid flag is required" }),
});

export type LineGuessFieldErrors = Record<string, string[] | undefined>;

export function parseLineGuessEntry(
  body: unknown,
):
  | { ok: true; data: LineGuessEntryInput }
  | { ok: false; error: string; fieldErrors: LineGuessFieldErrors } {
  const parsed = lineGuessEntrySchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the form and try again",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  return { ok: true, data: parsed.data };
}

export function lineGuessPinAttemptAllowed(
  key: string,
  now = Date.now(),
): boolean {
  const row = pinFailures.get(key);
  if (!row) return true;
  if (now >= row.windowEndsAt) {
    pinFailures.delete(key);
    return true;
  }
  return row.count < PIN_FAIL_LIMIT;
}

export function recordLineGuessPinFailure(key: string, now = Date.now()): void {
  const row = pinFailures.get(key);
  if (!row || now >= row.windowEndsAt) {
    pinFailures.set(key, { count: 1, windowEndsAt: now + PIN_FAIL_WINDOW_MS });
    return;
  }
  row.count += 1;
  if (row.count >= PIN_FAIL_LIMIT) {
    row.windowEndsAt = now + PIN_FAIL_WINDOW_MS;
  }
}

export function clearLineGuessPinFailures(key: string): void {
  pinFailures.delete(key);
}

export function lineGuessPinClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  return ip.slice(0, 80);
}
