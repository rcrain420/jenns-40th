import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safe-path";
import { requestPasswordReset } from "@/lib/users";

export async function POST(request: Request) {
  let body: { email?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Enter your email" }, { status: 400 });
  }

  await requestPasswordReset({
    email,
    next: safeNextPath(body.next),
  });
  return NextResponse.json({ ok: true });
}
