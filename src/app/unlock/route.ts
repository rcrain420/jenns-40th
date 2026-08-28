import { NextResponse } from "next/server";
import { grantEventUnlock, setLoggedInUser } from "@/lib/auth";
import {
  evaluateEventUnlockToken,
  unlockLandingPath,
} from "@/lib/event-unlock-token";
import {
  registrationMatchesUnlock,
  signInRegistrantFromUnlock,
} from "@/lib/registration";

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
  const signedIn = await signInRegistrantFromUnlock({
    teamId: evaluated.teamId,
    email: evaluated.email,
  });
  if (signedIn.userId) {
    await setLoggedInUser(signedIn.userId);
  }
  return redirectTo(request, unlockLandingPath());
}
