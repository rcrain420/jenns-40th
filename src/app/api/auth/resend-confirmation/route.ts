import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-path";
import { resendConfirmation } from "@/lib/users";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  let next: string | undefined;
  try {
    const body = (await request.json()) as { next?: unknown };
    next = safeNextPath(body.next);
  } catch {
    next = "/catches";
  }

  const result = await resendConfirmation({ userId: user.id, next });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const seconds = result.cooldownMs
    ? Math.ceil(result.cooldownMs / 1000)
    : undefined;
  return NextResponse.json({
    ok: true,
    ...(seconds
      ? { error: `Sent — wait ${seconds} seconds to send another.` }
      : {}),
    ...(result.devConfirmUrl ? { devConfirmUrl: result.devConfirmUrl } : {}),
  });
}
