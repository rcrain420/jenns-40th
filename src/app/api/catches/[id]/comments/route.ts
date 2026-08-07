import { NextResponse } from "next/server";
import { requireEventUnlock } from "@/lib/auth";
import { addCatchComment, listCommentsForCatch, serializeComment } from "@/lib/comments";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const comments = await listCommentsForCatch(id);
  return NextResponse.json({
    comments: comments.map(serializeComment),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const unlocked = await requireEventUnlock();
  if (!unlocked) {
    return NextResponse.json(
      { error: "Event PIN required" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as { anglerId?: unknown; body?: unknown };
  const anglerId = typeof data.anglerId === "string" ? data.anglerId.trim() : "";
  const text = typeof data.body === "string" ? data.body : "";

  if (!anglerId) {
    return NextResponse.json({ error: "Select an angler" }, { status: 400 });
  }

  const result = await addCatchComment({
    catchId: id,
    anglerId,
    body: text,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ comment: result.comment });
}
