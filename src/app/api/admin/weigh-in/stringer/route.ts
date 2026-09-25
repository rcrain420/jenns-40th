import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveStringer, toWeighError, WeighInError } from "@/lib/weigh-in";

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
    const action = body.action;
    if (action !== "assign" && action !== "lock" && action !== "unlock" && action !== "dq") {
      throw new WeighInError("Action must be assign, lock, unlock, or dq.");
    }
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const teamId = typeof body.teamId === "string" ? body.teamId : "";
    if (!sessionId || !teamId) throw new WeighInError("Session and team are required.");

    const redfish = Array.isArray(body.redfish)
      ? body.redfish.flatMap((slot) => {
          if (!slot || typeof slot !== "object") return [];
          const row = slot as { slot?: unknown; weighedFishId?: unknown };
          const n = typeof row.slot === "number" ? row.slot : Number(row.slot);
          if (!Number.isInteger(n) || typeof row.weighedFishId !== "string") return [];
          return [{ slot: n, weighedFishId: row.weighedFishId }];
        })
      : [];

    const result = await saveStringer({
      sessionId,
      teamId,
      action,
      troutFishId: typeof body.troutFishId === "string" ? body.troutFishId : null,
      redfish,
      unlockNote: typeof body.unlockNote === "string" ? body.unlockNote : null,
      dqReason: typeof body.dqReason === "string" ? body.dqReason : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const mapped = toWeighError(err);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
