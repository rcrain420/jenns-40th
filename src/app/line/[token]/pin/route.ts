import { NextResponse } from "next/server";
import {
  clearLineGuessPinFailures,
  lineGuessPin,
  lineGuessPinAttemptAllowed,
  lineGuessPinClientKey,
  lineGuessPinStatus,
  lineGuessTokenMatches,
  recordLineGuessPinFailure,
} from "@/lib/line-guess";
import { lockLineGuessStaff, unlockLineGuessStaff } from "@/lib/line-guess-session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!lineGuessTokenMatches(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pinStatus = lineGuessPinStatus();
  if (pinStatus !== "ok" || !lineGuessPin()) {
    return NextResponse.json(
      {
        error:
          pinStatus === "invalid"
            ? "LINE_GUESS_PIN must be 4–8 digits."
            : "Set LINE_GUESS_PIN on the server to open the tracker.",
      },
      { status: 503 },
    );
  }

  const key = lineGuessPinClientKey(request);
  if (!lineGuessPinAttemptAllowed(key)) {
    return NextResponse.json(
      { error: "Too many tries. Wait a few minutes." },
      { status: 429 },
    );
  }

  let pin = "";
  try {
    const body = (await request.json()) as { pin?: unknown };
    pin = typeof body.pin === "string" ? body.pin : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const unlocked = await unlockLineGuessStaff(pin);
  if (!unlocked) {
    recordLineGuessPinFailure(key);
    return NextResponse.json({ error: "That PIN is not right." }, { status: 401 });
  }

  clearLineGuessPinFailures(key);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!lineGuessTokenMatches(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await lockLineGuessStaff();
  return NextResponse.json({ ok: true });
}
