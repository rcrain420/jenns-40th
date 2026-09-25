import { NextResponse } from "next/server";
import { getSidePotLeaderboard, toWeighError } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session");
  try {
    const board = await getSidePotLeaderboard(sessionId);
    return NextResponse.json(board, { headers: NO_STORE });
  } catch (err) {
    const mapped = toWeighError(err);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status, headers: NO_STORE });
  }
}
