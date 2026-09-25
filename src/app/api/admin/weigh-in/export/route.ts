import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toWeighError, weighInResultsCsv, WeighInError } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ error: "Choose a weigh session." }, { status: 400 });
  }

  try {
    const csv = await weighInResultsCsv(sessionId);
    return new NextResponse(csv.body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${csv.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const mapped = err instanceof WeighInError ? toWeighError(err) : toWeighError(err);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
