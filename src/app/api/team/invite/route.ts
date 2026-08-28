import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { inviteAnglerOnTeam } from "@/lib/angler-invite";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  let body: { anglerId?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const anglerId = typeof body.anglerId === "string" ? body.anglerId.trim() : "";
  if (!anglerId) {
    return NextResponse.json({ error: "Angler is required" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : undefined;
  const result = await inviteAnglerOnTeam({
    userId: user.id,
    anglerId,
    email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
    anglerId: result.anglerId,
  });
}
