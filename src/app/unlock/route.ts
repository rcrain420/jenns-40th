import { NextResponse } from "next/server";
import { grantEventUnlock } from "@/lib/auth";
import { evaluateEventUnlockToken } from "@/lib/event-unlock-token";
import { registrationMatchesUnlock } from "@/lib/registration";

export const dynamic = "force-dynamic";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const evaluated = evaluateEventUnlockToken(token);

  if (!evaluated.ok) {
    const reason = evaluated.status === 400 ? "missing" : "invalid";
    return redirectTo(request, `/unlock/failed?reason=${reason}`);
  }

  if (
    !evaluated.teamId ||
    !evaluated.email ||
    !(await registrationMatchesUnlock({
      teamId: evaluated.teamId,
      email: evaluated.email,
    }))
  ) {
    return redirectTo(request, "/unlock/failed?reason=invalid");
  }

  await grantEventUnlock();
  return redirectTo(request, "/catches?unlocked=1");
}
