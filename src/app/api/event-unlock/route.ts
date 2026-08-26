import { NextResponse } from "next/server";
import { grantEventUnlock, getEventSession, isEventPinConfigured } from "@/lib/auth";
import {
  evaluateEventPin,
  evaluateEventUnlockToken,
  readEventUnlockInput,
} from "@/lib/event-unlock-token";
import { registrationMatchesUnlock } from "@/lib/registration";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pin, token } = readEventUnlockInput(body);

  if (token.trim()) {
    const evaluated = evaluateEventUnlockToken(token);
    if (!evaluated.ok) {
      return NextResponse.json(
        { error: evaluated.error },
        { status: evaluated.status },
      );
    }
    if (
      !evaluated.teamId ||
      !evaluated.email ||
      !(await registrationMatchesUnlock({
        teamId: evaluated.teamId,
        email: evaluated.email,
      }))
    ) {
      return NextResponse.json(
        { error: "This unlock link is not valid." },
        { status: 401 },
      );
    }

    await grantEventUnlock();
    return NextResponse.json({ ok: true, via: "link" });
  }

  const evaluated = evaluateEventPin(pin);
  if (!evaluated.ok) {
    return NextResponse.json(
      { error: evaluated.error },
      { status: evaluated.status },
    );
  }

  await grantEventUnlock();
  return NextResponse.json({ ok: true, via: "pin" });
}

export async function GET() {
  const session = await getEventSession();
  return NextResponse.json({
    unlocked: Boolean(session.unlocked),
    configured: isEventPinConfigured(),
  });
}
