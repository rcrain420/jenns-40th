import { createHmac, timingSafeEqual } from "crypto";

export const TEAM_INVITE_PURPOSE = "team-invite" as const;
export const TEAM_INVITE_TTL_SECONDS = 60 * 60 * 24 * 90;

type InvitePayload = {
  v: 1;
  purpose: typeof TEAM_INVITE_PURPOSE;
  teamId: string;
  exp: number;
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

export function teamInvitePath(token: string): string {
  return `/join?token=${encodeURIComponent(token)}`;
}

export function issueTeamInviteToken(input: {
  teamId: string;
  now?: Date;
  ttlSeconds?: number;
}): { token: string; expiresAt: Date } {
  const now = input.now ?? new Date();
  const ttlSeconds = input.ttlSeconds ?? TEAM_INVITE_TTL_SECONDS;
  const exp = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const payload: InvitePayload = {
    v: 1,
    purpose: TEAM_INVITE_PURPOSE,
    teamId: input.teamId,
    exp,
  };
  const body = toBase64Url(JSON.stringify(payload));
  return {
    token: `${body}.${signBody(body)}`,
    expiresAt: new Date(exp * 1000),
  };
}

export function verifyTeamInviteToken(
  token: string,
  now = new Date(),
): { ok: true; teamId: string } | { ok: false; reason: "invalid" | "expired" } {
  if (typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "invalid" };
  }
  const separator = token.lastIndexOf(".");
  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!body || !signature || !safeEqual(signature, signBody(body))) {
    return { ok: false, reason: "invalid" };
  }
  let payload: InvitePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as InvitePayload;
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (payload.v !== 1 || payload.purpose !== TEAM_INVITE_PURPOSE || !payload.teamId) {
    return { ok: false, reason: "invalid" };
  }
  if (payload.exp * 1000 < now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, teamId: payload.teamId };
}
