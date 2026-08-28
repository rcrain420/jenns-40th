import { NextResponse } from "next/server";
import {
  clearRegistrantClaim,
  getRegistrantClaim,
  setLoggedInUser,
} from "@/lib/auth";
import { registrantClaimMatches } from "@/lib/registrant-unlock";
import { loginUser } from "@/lib/users";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const registrantClaim = await getRegistrantClaim();
  const result = await loginUser({
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
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
  return NextResponse.json({ ok: true, user: result.user });
}
