import { NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser } from "@/lib/auth";
import { suggestTeamNames } from "@/lib/team-name-ai";

const bodySchema = z.object({
  hint: z.string().trim().max(200).optional(),
  avoid: z.array(z.string().trim().max(60)).max(20).optional(),
});

export async function POST(request: Request) {
  const user = await requireVerifiedUser();
  if (!user) {
    return NextResponse.json(
      { error: "Confirm your email to use AI name ideas" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await suggestTeamNames({
    hint: parsed.data.hint,
    avoid: parsed.data.avoid,
  });

  return NextResponse.json(result);
}
