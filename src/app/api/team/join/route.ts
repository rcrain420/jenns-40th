import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { grantSiteAccessAfterJoin } from "@/lib/join-access";
import { joinTeam, verifyTeamInviteToken } from "@/lib/team-invite";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first", needsAuth: true }, { status: 401 });
  }

  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const verified = verifyTeamInviteToken(token);
  if (!verified.ok) {
    return NextResponse.json(
      {
        error:
          verified.reason === "expired"
            ? "This invite expired. Ask your teammate for a new link."
            : "This invite is not valid.",
      },
      { status: 400 },
    );
  }

  const result = await joinTeam(user.id, verified.teamId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await grantSiteAccessAfterJoin(user.id);

  return NextResponse.json({
    ok: true,
    already: result.already,
    teamName: result.teamName,
    unlocked: true,
  });
}
