import { emailedAnglersForJoinInvite, type JoinInviteAngler } from "./angler-join-recipients";
import { sendTeamInviteEmail } from "./team-invite-email";

export {
  emailedAnglersForJoinInvite,
  type JoinInviteAngler,
} from "./angler-join-recipients";

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
