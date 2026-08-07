import { NextResponse } from "next/server";
import {
  checkEventPin,
  getEventSession,
  isEventPinConfigured,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isEventPinConfigured()) {
    return NextResponse.json(
      { error: "Event PIN is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pin =
    typeof body === "object" &&
    body !== null &&
    "pin" in body &&
    typeof (body as { pin: unknown }).pin === "string"
      ? (body as { pin: string }).pin.trim()
      : "";

  if (!pin) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  if (!checkEventPin(pin)) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  const session = await getEventSession();
  session.unlocked = true;
  await session.save();

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getEventSession();
  return NextResponse.json({
    unlocked: Boolean(session.unlocked),
    configured: isEventPinConfigured(),
  });
}
