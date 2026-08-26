import { NextResponse } from "next/server";
import { setLoggedInUser } from "@/lib/auth";
import { resetPasswordWithToken } from "@/lib/users";

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await resetPasswordWithToken({
    token: typeof body.token === "string" ? body.token : "",
    password: typeof body.password === "string" ? body.password : "",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  await setLoggedInUser(result.user.id);
  return NextResponse.json({ ok: true, user: result.user });
}
