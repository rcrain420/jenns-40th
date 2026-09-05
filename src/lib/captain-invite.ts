import { shouldSendCaptainInvite } from "./captain-invite-plan";
import { prisma } from "./db";
import { sendCaptainInviteEmail } from "./team-invite-email";
import { normalizeEmail } from "./safe-path";

export { shouldSendCaptainInvite } from "./captain-invite-plan";

export async function sendCaptainJoinInvite(opts: {
  teamId: string;
  teamName: string;
  captainName?: string | null;
  captainEmail?: string | null;
}): Promise<
  | { ok: true; sent: true; email: string }
  | { ok: true; sent: false; skipped: "empty" | "joined" | "other-team" }
  | { ok: false; error: string; status: number }
> {
  const email = normalizeEmail(opts.captainEmail ?? "");
  if (!email || !email.includes("@")) {
    return { ok: true, sent: false, skipped: "empty" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      membership: { select: { teamId: true } },
    },
  });
  const memberTeamId = existingUser?.membership?.teamId ?? null;
  const plan = shouldSendCaptainInvite({
    email,
    alreadyOnThisBoat: memberTeamId === opts.teamId,
    onAnotherTeam: Boolean(memberTeamId && memberTeamId !== opts.teamId),
  });
  if (!plan.send) {
    if (plan.skipReason === "other-team") {
      return {
        ok: false,
        error: "That email is already on another boat.",
        status: 409,
      };
    }
    return { ok: true, sent: false, skipped: plan.skipReason ?? "empty" };
  }

  const delivery = await sendCaptainInviteEmail({
    teamId: opts.teamId,
    teamName: opts.teamName,
    captainName: opts.captainName?.trim() || "Captain",
    to: email,
  });

  if (!delivery.delivered) {
    return {
      ok: false,
      error: "Could not send that invite. Try again, or copy the shared team link.",
      status: 502,
    };
  }

  return { ok: true, sent: true, email };
}

export async function inviteCaptainOnTeam(opts: {
  userId: string;
  email?: string;
  name?: string;
}): Promise<
  | { ok: true; sent: boolean; email: string | null; skipped?: "empty" | "joined" }
  | { ok: false; error: string; status: number }
> {
  const member = await prisma.teamMember.findUnique({
    where: { userId: opts.userId },
    include: {
      team: {
        select: {
          id: true,
          teamName: true,
          claimedByUserId: true,
          captainName: true,
          captainEmail: true,
        },
      },
    },
  });

  if (!member || member.team.claimedByUserId !== opts.userId) {
    return {
      ok: false,
      error: "Only the person who registered this team can set the captain.",
      status: 403,
    };
  }

  const result = await sendCaptainJoinInvite({
    teamId: member.team.id,
    teamName: member.team.teamName,
    captainName: opts.name ?? member.team.captainName,
    captainEmail: opts.email ?? member.team.captainEmail,
  });
  if (!result.ok) return result;
  if (!result.sent) {
    return {
      ok: true,
      sent: false,
      email: normalizeEmail(opts.email ?? member.team.captainEmail ?? "") || null,
      skipped: result.skipped === "other-team" ? undefined : result.skipped,
    };
  }
  return { ok: true, sent: true, email: result.email };
}
