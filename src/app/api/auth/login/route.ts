import { NextResponse } from "next/server";
import { setLoggedInUser } from "@/lib/auth";
import { loginUser } from "@/lib/users";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await loginUser({
    email: typeof body.email === "string" ? body.email : "",
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
