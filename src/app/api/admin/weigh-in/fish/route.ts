import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveWeighedFish, toWeighError, WeighInError } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new WeighInError("Invalid JSON");
  }
  return body as Record<string, unknown>;
}

function optionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function requiredNumber(value: unknown, label: string): number {
  const n = optionalNumber(value);
  if (n == null) throw new WeighInError(`${label} is required.`);
  return n;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = asRecord(await request.json());
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const teamId = typeof body.teamId === "string" ? body.teamId : "";
    const species = typeof body.species === "string" ? body.species : "";
    if (!sessionId || !teamId || !species) {
      throw new WeighInError("Session, team, and species are required.");
    }
    const result = await saveWeighedFish({
      id: typeof body.id === "string" ? body.id : null,
      sessionId,
      teamId,
      species,
      weightLbs: requiredNumber(body.weightLbs, "Weight"),
      lengthInches: optionalNumber(body.lengthInches),
      spotCount:
        body.spotCount == null || body.spotCount === ""
          ? null
          : Math.trunc(requiredNumber(body.spotCount, "Spot count")),
      taggedTrout: body.taggedTrout === true,
      disqualified: body.disqualified === true,
      dqReason: typeof body.dqReason === "string" ? body.dqReason : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      actorUserId: admin.id,
    });
    return NextResponse.json(result);
  } catch (err) {
    const mapped = toWeighError(err);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
