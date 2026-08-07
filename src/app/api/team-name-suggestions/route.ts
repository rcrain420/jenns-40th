import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEventUnlock } from "@/lib/auth";
import { suggestTeamNames } from "@/lib/team-name-ai";

const bodySchema = z.object({
  hint: z.string().trim().max(200).optional(),
  avoid: z.array(z.string().trim().max(60)).max(20).optional(),
});

export async function POST(request: Request) {
  const unlocked = await requireEventUnlock();
  if (!unlocked) {
    return NextResponse.json(
      { error: "Event PIN required" },
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
