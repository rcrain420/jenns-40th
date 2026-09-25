import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setWeighSession, toWeighError, WeighInError } from "@/lib/weigh-in";

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
    if (action !== "create" && action !== "open" && action !== "close") {
      throw new WeighInError("Action must be create, open, or close.");
    }
    const result = await setWeighSession({
      action,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      label: typeof body.label === "string" ? body.label : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const mapped = toWeighError(err);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
