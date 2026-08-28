import { sendTeamInviteEmail, buildTeamInviteEmail } from "./team-invite-email";

export type JoinInviteAngler = {
  fullName: string;
  email?: string | null;
};

/** Seats with an email get Join the boat. Name-only seats stay on PIN / shared link. */
export function emailedAnglersForJoinInvite<T extends JoinInviteAngler>(
  anglers: T[],
): Array<T & { email: string }> {
  const seen = new Set<string>();
  const recipients: Array<T & { email: string }> = [];
  for (const angler of anglers) {
    const email = angler.email?.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ ...angler, email });
  }
  return recipients;
}

export function joinInviteMessagesForTeam(input: {
  teamId: string;
  teamName: string;
  anglers: JoinInviteAngler[];
}) {
  return emailedAnglersForJoinInvite(input.anglers).map((angler) =>
    buildTeamInviteEmail({
      teamId: input.teamId,
      teamName: input.teamName,
      anglerName: angler.fullName,
      to: angler.email,
    }),
  );
}

/** Register-time send. Invite from My team still goes through inviteAnglerOnTeam. */
export async function sendJoinEmailsForRegisteredAnglers(input: {
  teamId: string;
  teamName: string;
  anglers: JoinInviteAngler[];
}): Promise<{ attempted: number; sent: number }> {
  const recipients = emailedAnglersForJoinInvite(input.anglers);
  let sent = 0;
  for (const angler of recipients) {
    try {
      const delivery = await sendTeamInviteEmail({
        teamId: input.teamId,
        teamName: input.teamName,
        anglerName: angler.fullName,
        to: angler.email,
      });
      if (delivery.delivered) sent += 1;
      else {
        console.error(
          "[register] join invite not delivered",
          angler.email,
          delivery.error,
        );
      }
    } catch (error) {
      console.error("[register] join invite failed", angler.email, error);
    }
  }
  return { attempted: recipients.length, sent };
}
