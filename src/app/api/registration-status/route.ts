import { NextResponse } from "next/server";
import { getRegistrationAvailability } from "@/lib/registration";

export async function GET() {
  const status = await getRegistrationAvailability();
  return NextResponse.json(status);
}
