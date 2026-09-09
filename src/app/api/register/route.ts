import { NextResponse } from "next/server";
import { sendJoinEmailsForRegisteredAnglers } from "@/lib/angler-join-invites";
import { sendCaptainJoinInvite } from "@/lib/captain-invite";
import { getCurrentUser } from "@/lib/auth";
import { ENTRY_KIND, paidEntrySeatCount } from "@/lib/config";
import {
  registerApiAllowsCreate,
  userHasRegisteredTeam,
} from "@/lib/register-logged-in";
import {
  createTeamRegistration,
  createYouthLandRegistration,
} from "@/lib/registration";
import { sendRegistrationConfirmation } from "@/lib/registration-email";
import {
  registrationSchema,
  youthLandRegistrationSchema,
} from "@/lib/validation";

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

  const actor = user ? { userId: user.id, email: user.email } : null;
  const wantsLand =
    typeof body === "object" &&
    body !== null &&
    "entryKind" in body &&
    (body as { entryKind?: string }).entryKind === ENTRY_KIND.YOUTH_LAND;

  const result = wantsLand
    ? await (async () => {
        const parsed = youthLandRegistrationSchema.safeParse(body);
        if (!parsed.success) {
          return {
            ok: false as const,
            error: "Validation failed",
            status: 400,
            fieldErrors: parsed.error.flatten().fieldErrors,
          };
        }
        return createYouthLandRegistration(parsed.data, actor);
      })()
    : await (async () => {
        const parsed = registrationSchema.safeParse(body);
        if (!parsed.success) {
          return {
            ok: false as const,
            error: "Validation failed",
            status: 400,
            fieldErrors: parsed.error.flatten().fieldErrors,
          };
        }
        return createTeamRegistration(parsed.data, actor);
      })();
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        ...("fieldErrors" in result ? { fieldErrors: result.fieldErrors } : {}),
      },
      { status: result.status },
    );
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

  let captainInviteSent = false;
  try {
    const captainInvite = await sendCaptainJoinInvite({
      teamId: result.team.id,
      teamName: result.team.teamName,
      captainName: result.team.captainName,
      captainEmail: result.team.captainEmail,
    });
    captainInviteSent = captainInvite.ok && captainInvite.sent;
    if (!captainInvite.ok && captainInvite.status !== 409) {
      console.error("[register] captain invite failed", captainInvite.error);
    }
  } catch (error) {
    console.error("[register] captain invite failed", error);
  }

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
    captainInviteSent,
  });
}
