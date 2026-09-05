import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCanDeleteCatch } from "@/lib/catch-delete";
import { deleteCatchById } from "@/lib/catches";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const viewer = await getCurrentUser();
  const allowed = assertCanDeleteCatch(viewer);
  if (!allowed.ok) {
    return NextResponse.json(
      { error: allowed.error },
      { status: allowed.status },
    );
  }

  const { id } = await context.params;
  const result = await deleteCatchById(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
