import { createHmac } from "node:crypto";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { lineGuessPin, secretsMatch } from "./line-guess.ts";

export type LineGuessStaffSession = {
  pinTag?: string;
};

function sessionPassword(): string {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("Server session is not configured");
  }
  return password;
}

function staffSessionOptions(): SessionOptions {
  return {
    cookieName: "jenns40_line_guess",
    password: sessionPassword(),
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/line",
      maxAge: 60 * 60 * 36,
    },
  };
}

function pinTag(pin: string): string {
  return createHmac("sha256", sessionPassword())
    .update(`line-guess:${pin}`)
    .digest("hex");
}

async function getLineGuessStaffSession() {
  return getIronSession<LineGuessStaffSession>(
    await cookies(),
    staffSessionOptions(),
  );
}

export async function lineGuessStaffUnlocked(): Promise<boolean> {
  const pin = lineGuessPin();
  if (!pin) return false;
  const session = await getLineGuessStaffSession();
  if (!session.pinTag) return false;
  return secretsMatch(session.pinTag, pinTag(pin));
}

export async function unlockLineGuessStaff(pin: string): Promise<boolean> {
  const expected = lineGuessPin();
  const provided = pin.trim();
  if (!expected || !secretsMatch(provided, expected)) return false;
  const session = await getLineGuessStaffSession();
  session.pinTag = pinTag(expected);
  await session.save();
  return true;
}

export async function lockLineGuessStaff(): Promise<void> {
  const session = await getLineGuessStaffSession();
  session.destroy();
}
