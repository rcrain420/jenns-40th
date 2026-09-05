import { randomBytes } from "crypto";
import { TEAM_INVITE_TTL_SECONDS } from "./team-invite-token";

/** 9 bytes → 12-char base64url. Unguessable; short enough to share. */
export const TEAM_INVITE_CODE_BYTES = 9;
export const TEAM_INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{10,16}$/;

export function generateInviteCode(): string {
  return randomBytes(TEAM_INVITE_CODE_BYTES).toString("base64url");
}

export function isInviteCodeFormat(code: string): boolean {
  return TEAM_INVITE_CODE_PATTERN.test(code.trim());
}

export function teamInviteSharePath(code: string): string {
  return `/j/${code.trim()}`;
}

export function anglerInviteSharePath(
  code: string,
  email: string,
  name?: string,
): string {
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
  });
  if (name?.trim()) params.set("name", name.trim());
  return `${teamInviteSharePath(code)}?${params.toString()}`;
}

export function inviteCodeExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + TEAM_INVITE_TTL_SECONDS * 1000);
}

export function joinReturnPath(input: {
  code?: string;
  token?: string;
  email?: string;
  name?: string;
}): string {
  const code = input.code?.trim() ?? "";
  if (code && isInviteCodeFormat(code)) {
    const params = new URLSearchParams();
    if (input.email?.trim()) {
      params.set("email", input.email.trim().toLowerCase());
    }
    if (input.name?.trim()) params.set("name", input.name.trim());
    const query = params.toString();
    return query ? `${teamInviteSharePath(code)}?${query}` : teamInviteSharePath(code);
  }
  const token = input.token?.trim() ?? "";
  if (!token) return "/join";
  const params = new URLSearchParams({ token });
  if (input.email?.trim()) {
    params.set("email", input.email.trim().toLowerCase());
  }
  if (input.name?.trim()) params.set("name", input.name.trim());
  return `/join?${params.toString()}`;
}
