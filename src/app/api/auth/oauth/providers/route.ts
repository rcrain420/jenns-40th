import { NextResponse } from "next/server";
import { oauthProvidersStatus } from "@/lib/oauth";

export async function GET() {
  return NextResponse.json(oauthProvidersStatus());
}
