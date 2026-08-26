import { NextResponse } from "next/server";
import { clearLoggedInUser } from "@/lib/auth";

export async function POST() {
  await clearLoggedInUser();
  return NextResponse.json({ ok: true });
}
