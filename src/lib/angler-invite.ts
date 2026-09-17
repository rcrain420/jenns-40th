import { prisma } from "./db";
import { sendTeamInviteEmail } from "./team-invite-email";
import { normalizeEmail } from "./safe-path";
import { userOwnsTeam } from "./team-membership";

export async function inviteAnglerOnTeam(opts: {
  userId: string;
  anglerId: string;
  email?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { id: true, email: true },
  });
  const angler = await prisma.angler.findUnique({
    where: { id: opts.anglerId },
    include: {
      team: {
        select: {
          id: true,
          teamName: true,
          claimedByUserId: true,
          registrantEmail: true,
        },
      },
    },
  });
  if (!user || !angler) {
    return { ok: false as const, error: "That angler is not on this team.", status: 404 };
  }
  if (
    !userOwnsTeam({
      userId: user.id,
      userEmail: user.email,
      claimedByUserId: angler.team.claimedByUserId,
      registrantEmail: angler.team.registrantEmail,
    })
  ) {
    return {
      ok: false as const,
      error: "Only the person who registered this team can send invites.",
      status: 403,
    };
  }

  if (angler.isYouth) {
    return {
      ok: false as const,
      error:
        "Youth anglers do not get a Join the boat / create-account invite. Parent login is the login.",
      status: 400,
    };
  }

  const nextEmail = normalizeEmail(opts.email ?? angler.email ?? "");
  if (!nextEmail || !nextEmail.includes("@")) {
    return {
      ok: false as const,
      error:
        "Add an email to send an invite. Name-only seats use the shared link to create an account.",
      status: 400,
    };
  }

  if (angler.email !== nextEmail) {
    await prisma.angler.update({
      where: { id: angler.id },
      data: { email: nextEmail },
    });
  }

  const delivery = await sendTeamInviteEmail({
    teamId: angler.team.id,
    teamName: angler.team.teamName,
    anglerName: angler.fullName,
    to: nextEmail,
  });

  if (!delivery.delivered) {
    return {
      ok: false as const,
      error: "Could not send that invite. Try again, or copy the shared team link.",
      status: 502,
    };
  }

  return {
    ok: true as const,
    email: nextEmail,
    anglerId: angler.id,
  };
}
