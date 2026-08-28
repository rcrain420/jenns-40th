import { NextResponse } from "next/server";
import { rememberRegistrantClaim } from "@/lib/auth";
import { evaluateEventUnlockToken } from "@/lib/event-unlock-token";
import { registrationMatchesUnlock } from "@/lib/registration";
import { planOpenMyTeamUnlock } from "@/lib/open-my-team-access";

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

  const plan = planOpenMyTeamUnlock({
    teamId: evaluated.teamId,
    email: evaluated.email,
  });
  await rememberRegistrantClaim({
    teamId: evaluated.teamId,
    email: evaluated.email,
  });
  return redirectTo(request, plan.location);
}
