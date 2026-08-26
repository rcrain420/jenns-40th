import { NextResponse } from "next/server";
import { setLoggedInUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-path";
import { confirmEmailToken } from "@/lib/users";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const next = safeNextPath(searchParams.get("next"));
  const origin = new URL(request.url).origin;

  if (!token) {
    return NextResponse.redirect(new URL(`/confirm-email?next=${encodeURIComponent(next)}`, origin));
  }

  const result = await confirmEmailToken(token);
  if (!result.ok) {
    const fail = new URL("/confirm-email", origin);
    fail.searchParams.set("next", next);
    fail.searchParams.set("expired", "1");
    return NextResponse.redirect(fail);
  }

  await setLoggedInUser(result.user.id);
  return NextResponse.redirect(new URL(next, origin));
}
