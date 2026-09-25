import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveSidePotEntry, toWeighError, WeighInError } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new WeighInError("Invalid JSON");
  }
  return body as Record<string, unknown>;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = asRecord(await request.json());
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const potId = typeof body.potId === "string" ? body.potId : "";
    const teamId = typeof body.teamId === "string" ? body.teamId : "";
    if (!sessionId || !potId || !teamId) {
      throw new WeighInError("Session, pot, and team are required.");
    }
    const result = await saveSidePotEntry({
      sessionId,
      potId,
      teamId,
      weighedFishId: typeof body.weighedFishId === "string" ? body.weighedFishId : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const mapped = toWeighError(err);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
