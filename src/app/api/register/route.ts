import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  claimTeamIfRegistrant,
  createTeamRegistration,
} from "@/lib/registration";
import { sendRegistrationConfirmation } from "@/lib/registration-email";
import { registrationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await createTeamRegistration(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const user = await getCurrentUser();
  if (user) {
    await claimTeamIfRegistrant({
      teamId: result.team.id,
      userId: user.id,
      email: user.email,
    });
  }

  try {
    await sendRegistrationConfirmation({
      teamId: result.team.id,
      teamName: result.team.teamName,
      amountDueCents: result.team.amountDueCents,
      registrantEmail: result.team.registrantEmail,
    });
  } catch (error) {
    console.error("[register] confirmation email failed", error);
  }

  return NextResponse.json({
    team: {
      id: result.team.id,
      teamName: result.team.teamName,
      amountDueCents: result.team.amountDueCents,
      anglerCount: result.team.anglers.length,
      paymentStatus: result.team.paymentStatus,
    },
  });
}
