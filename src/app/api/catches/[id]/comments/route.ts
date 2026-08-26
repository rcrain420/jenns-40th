import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth";
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
  const user = await requireVerifiedUser();
  if (!user) {
    return NextResponse.json(
      { error: "Confirm your email to comment", needsConfirmation: true },
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

  const data = body as { body?: unknown };
  const text = typeof data.body === "string" ? data.body : "";

  const result = await addCatchComment({
    catchId: id,
    user,
    body: text,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ comment: result.comment });
}
