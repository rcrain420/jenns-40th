import { createHmac, timingSafeEqual } from "crypto";

export const EVENT_UNLOCK_PURPOSE = "event-unlock" as const;
export const EVENT_UNLOCK_TTL_SECONDS = 60 * 60 * 24 * 14;

type EventUnlockPayload = {
  v: 1;
  purpose: typeof EVENT_UNLOCK_PURPOSE;
  teamId: string;
  email: string;
  exp: number;
};

export type VerifiedEventUnlock = {
  ok: true;
  teamId: string;
  email: string;
  expiresAt: Date;
};

export type EventUnlockFailure = {
  ok: false;
  reason: "invalid" | "expired";
};

function signingSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Session signing secret is not configured");
  }
  return secret;
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function signBody(body: string): string {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function normalizeUnlockEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function eventUnlockPath(token: string): string {
  return `/unlock?token=${encodeURIComponent(token)}`;
}

/** Fixed public landing after a valid unlock. Never the success-page referer. */
export const UNLOCK_SUCCESS_PATH = "/catches?unlocked=1";

export function unlockLandingPath(): string {
  return UNLOCK_SUCCESS_PATH;
}

export function issueEventUnlockToken(input: {
  teamId: string;
  email: string;
  now?: Date;
  ttlSeconds?: number;
}): { token: string; expiresAt: Date } {
  const now = input.now ?? new Date();
  const ttlSeconds = input.ttlSeconds ?? EVENT_UNLOCK_TTL_SECONDS;
  const exp = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const payload: EventUnlockPayload = {
    v: 1,
    purpose: EVENT_UNLOCK_PURPOSE,
    teamId: input.teamId,
    email: normalizeUnlockEmail(input.email),
    exp,
  };
  const body = toBase64Url(JSON.stringify(payload));
  return {
    token: `${body}.${signBody(body)}`,
    expiresAt: new Date(exp * 1000),
  };
}

export function verifyEventUnlockToken(
  token: string,
  now = new Date(),
): VerifiedEventUnlock | EventUnlockFailure {
  if (typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "invalid" };
  }

  const separator = token.lastIndexOf(".");
  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!body || !signature) {
    return { ok: false, reason: "invalid" };
  }

  let expected: string;
  try {
    expected = signBody(body);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (!safeEqual(signature, expected)) {
    return { ok: false, reason: "invalid" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    (payload as EventUnlockPayload).v !== 1 ||
    (payload as EventUnlockPayload).purpose !== EVENT_UNLOCK_PURPOSE ||
    typeof (payload as EventUnlockPayload).teamId !== "string" ||
    typeof (payload as EventUnlockPayload).email !== "string" ||
    typeof (payload as EventUnlockPayload).exp !== "number"
  ) {
    return { ok: false, reason: "invalid" };
  }

  const typed = payload as EventUnlockPayload;
  if (typed.exp <= Math.floor(now.getTime() / 1000)) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    teamId: typed.teamId,
    email: typed.email,
    expiresAt: new Date(typed.exp * 1000),
  };
}

export type EventUnlockResult =
  | { ok: true; via: "link" }
  | { ok: false; error: string; status: number };

export function evaluateEventUnlockToken(
  token: string,
  now = new Date(),
): EventUnlockResult & { teamId?: string; email?: string } {
  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, error: "Unlock link is missing", status: 400 };
  }

  const verified = verifyEventUnlockToken(trimmed, now);
  if (!verified.ok) {
    return {
      ok: false,
      error:
        verified.reason === "expired"
          ? "This link has expired. Sign in or create an account to open My team."
          : "This unlock link is not valid.",
      status: 401,
    };
  }

  return {
    ok: true,
    via: "link",
    teamId: verified.teamId,
    email: verified.email,
  };
}
