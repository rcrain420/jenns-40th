import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isLineGuessId,
  lineGuessPaidClaimSchema,
  lineGuessTokenMatches,
} from "@/lib/line-guess";
import { lineGuessStaffUnlocked } from "@/lib/line-guess-session";

export const dynamic = "force-dynamic";

async function guard(token: string, id: string) {
  if (!lineGuessTokenMatches(token) || !isLineGuessId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await lineGuessStaffUnlocked())) {
    return NextResponse.json({ error: "Enter the table PIN" }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string; id: string }> },
) {
  const { token, id } = await params;
  const denied = await guard(token, id);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = lineGuessPaidClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paid flag is required" }, { status: 400 });
  }

  const existing = await prisma.lineGuess.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.lineGuess.update({
    where: { id },
    data: { paidClaimed: parsed.data.paidClaimed },
  });
  return NextResponse.json({ ok: true, paidClaimed: row.paidClaimed });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string; id: string }> },
) {
  const { token, id } = await params;
  const denied = await guard(token, id);
  if (denied) return denied;

  const existing = await prisma.lineGuess.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lineGuess.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
