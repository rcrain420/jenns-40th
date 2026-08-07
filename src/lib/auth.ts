import { timingSafeEqual } from "crypto";
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type AdminSession = {
  isAdmin: boolean;
};

export type EventSession = {
  unlocked: boolean;
};

function getSessionPassword(): string {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters long",
    );
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

/** Constant-time string compare for secrets (pads to equal length). */
export function safeEqualSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still compare against something of equal length to avoid leaking length via timing
    // of the early return alone when lengths differ — compare provided to itself.
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

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return null;
  }
  return session;
}

export async function requireEventUnlock() {
  if (!isEventPinConfigured()) {
    // Local/dev convenience: no PIN configured → allow. Production must set EVENT_PIN.
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    return { unlocked: true };
  }
  const session = await getEventSession();
  if (!session.unlocked) {
    return null;
  }
  return session;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }
  return safeEqualSecret(password, expected);
}

export function checkEventPin(pin: string): boolean {
  const expected = process.env.EVENT_PIN;
  if (!expected) {
    return false;
  }
  return safeEqualSecret(pin, expected);
}

export function isEventPinConfigured(): boolean {
  return Boolean(process.env.EVENT_PIN);
}
