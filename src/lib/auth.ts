import { timingSafeEqual } from "crypto";
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import {
  checkEventPin,
  isEventPinConfigured,
  normalizeUnlockEmail,
} from "./event-unlock-token";
import type { RegistrantClaim } from "./registrant-unlock";
import { getUserById, toPublicUser, type PublicUser } from "./users";

export { checkEventPin, isEventPinConfigured };

export type AdminSession = {
  isAdmin: boolean;
};

export type EventSession = {
  unlocked: boolean;
  registrantClaim?: RegistrantClaim;
};

export type UserSession = {
  userId?: string;
};

function getSessionPassword(): string {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("Server session is not configured");
  }
  return password;
}

export function getSessionOptions(): SessionOptions {
  return {
    cookieName: "jenns40_admin",
    password: getSessionPassword(),
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}

export function getEventSessionOptions(): SessionOptions {
  return {
    cookieName: "jenns40_event",
    password: getSessionPassword(),
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 14,
    },
  };
}

export function getUserSessionOptions(): SessionOptions {
  return {
    cookieName: "jenns40_user",
    password: getSessionPassword(),
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 14,
    },
  };
}

/** Constant-time string compare for secrets (pads to equal length). */
export function safeEqualSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), getSessionOptions());
}

export async function getEventSession() {
  return getIronSession<EventSession>(
    await cookies(),
    getEventSessionOptions(),
  );
}

export async function getUserSession() {
  return getIronSession<UserSession>(await cookies(), getUserSessionOptions());
}

export async function setLoggedInUser(userId: string) {
  const session = await getUserSession();
  session.userId = userId;
  await session.save();
}

export async function clearLoggedInUser() {
  const session = await getUserSession();
  session.destroy();
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getUserSession();
  if (!session.userId) return null;
  const user = await getUserById(session.userId);
  return user ? toPublicUser(user) : null;
}

export async function requireVerifiedUser(): Promise<PublicUser | null> {
  const user = await getCurrentUser();
  if (!user?.emailVerified) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return user;
}

export async function grantEventUnlock() {
  const session = await getEventSession();
  session.unlocked = true;
  await session.save();
  return session;
}

export async function rememberRegistrantClaim(claim: RegistrantClaim) {
  const session = await getEventSession();
  session.unlocked = true;
  session.registrantClaim = {
    teamId: claim.teamId,
    email: normalizeUnlockEmail(claim.email),
  };
  await session.save();
  return session;
}

export async function getRegistrantClaim(): Promise<RegistrantClaim | null> {
  const session = await getEventSession();
  const claim = session.registrantClaim;
  if (!claim?.teamId || !claim.email) return null;
  return {
    teamId: claim.teamId,
    email: normalizeUnlockEmail(claim.email),
  };
}

export async function clearRegistrantClaim() {
  const session = await getEventSession();
  if (!session.registrantClaim) return;
  delete session.registrantClaim;
  await session.save();
}

export async function requireEventUnlock() {
  const session = await getEventSession();
  if (session.unlocked) {
    return session;
  }
  if (!isEventPinConfigured()) {
    // Local/dev convenience: no PIN configured → allow. Production stays locked
    // until a magic-link or PIN unlock sets the event session.
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    return { unlocked: true };
  }
  return null;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }
  return safeEqualSecret(password, expected);
}
