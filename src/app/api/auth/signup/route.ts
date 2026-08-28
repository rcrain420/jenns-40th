import { NextResponse } from "next/server";
import {
  clearRegistrantClaim,
  getRegistrantClaim,
  setLoggedInUser,
} from "@/lib/auth";
import { registrantClaimMatches } from "@/lib/open-my-team-access";
import { safeNextPath } from "@/lib/safe-path";
import { signupUser } from "@/lib/users";

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const registrantClaim = await getRegistrantClaim();
  const result = await signupUser({
    name: typeof body.name === "string" ? body.name : "",
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
    next: safeNextPath(body.next),
    registrantClaim,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  if (registrantClaimMatches(registrantClaim, result.user.email)) {
    await clearRegistrantClaim();
  }
  await setLoggedInUser(result.user.id);
  return NextResponse.json({
    ok: true,
    user: result.user,
    confirmationEmailSent: result.confirmationEmailSent ?? false,
    ...(result.devConfirmUrl ? { devConfirmUrl: result.devConfirmUrl } : {}),
  });
}
