import { NextResponse } from "next/server";
import { sendJoinEmailsForRegisteredAnglers } from "@/lib/angler-join-invites";
import { getCurrentUser } from "@/lib/auth";
import { paidEntrySeatCount } from "@/lib/config";
import {
  registerApiAllowsCreate,
  userHasRegisteredTeam,
} from "@/lib/register-logged-in";
import { createTeamRegistration } from "@/lib/registration";
import { sendRegistrationConfirmation } from "@/lib/registration-email";
import { registrationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const signedIn = Boolean(user);
  if (
    !registerApiAllowsCreate({
      signedIn,
      hasTeam: userHasRegisteredTeam(user),
    })
  ) {
    if (!signedIn) {
      return NextResponse.json(
        { error: "Sign in to register a team." },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: "You're already registered. Open your boat instead." },
      { status: 409 },
    );
  }

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

  const result = await createTeamRegistration(
    parsed.data,
    user ? { userId: user.id, email: user.email } : null,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let confirmationEmailSent = false;
  try {
    const delivery = await sendRegistrationConfirmation({
      teamId: result.team.id,
      teamName: result.team.teamName,
      amountDueCents: result.team.amountDueCents,
      registrantEmail: result.team.registrantEmail,
      paidSeatCount: paidEntrySeatCount(result.team.anglers),
      youthSeatCount: result.team.anglers.filter((a) => a.isYouth).length,
    });
    confirmationEmailSent = delivery.delivered;
    if (!delivery.delivered) {
      console.error(
        "[register] confirmation email not delivered",
        delivery.error,
      );
    }
  } catch (error) {
    console.error("[register] confirmation email failed", error);
  }

  const joinInvites = await sendJoinEmailsForRegisteredAnglers({
    teamId: result.team.id,
    teamName: result.team.teamName,
    anglers: result.team.anglers,
  });

  return NextResponse.json({
    team: {
      id: result.team.id,
      teamName: result.team.teamName,
      amountDueCents: result.team.amountDueCents,
      anglerCount: result.team.anglers.length,
      paymentStatus: result.team.paymentStatus,
    },
    confirmationEmailSent,
    joinEmailsAttempted: joinInvites.attempted,
    joinEmailsSent: joinInvites.sent,
  });
}
