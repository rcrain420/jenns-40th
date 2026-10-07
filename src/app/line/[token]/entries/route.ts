import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  LINE_GUESS_METHOD,
  lineGuessTokenMatches,
  parseLineGuessEntry,
} from "@/lib/line-guess";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!lineGuessTokenMatches(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseLineGuessEntry(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, fieldErrors: parsed.fieldErrors },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.lineGuess.create({
      data: {
        name: parsed.data.name,
        guessFeet: parsed.data.guessFeet,
        paidClaimed: true,
        method: LINE_GUESS_METHOD,
        note: parsed.data.note,
      },
    });
    return NextResponse.json({
      ok: true,
      name: row.name,
      guessFeet: row.guessFeet,
    });
  } catch (error) {
    console.error("[line-guess] create", error);
    return NextResponse.json({ error: "Could not save the guess" }, { status: 500 });
  }
}
