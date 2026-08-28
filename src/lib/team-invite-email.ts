import { EVENT } from "./config";
import { sendEmail, type EmailDelivery } from "./email";
import { getAppUrl } from "./safe-path";
import { anglerInvitePath, issueTeamInviteToken } from "./team-invite-token";
import { teamInviteEmailCopy } from "./team-invite-email-copy";

export function anglerInviteUrl(
  teamId: string,
  email: string,
  name?: string,
): string {
  const { token } = issueTeamInviteToken({ teamId });
  return new URL(
    anglerInvitePath(token, email, name),
    `${getAppUrl()}/`,
  ).toString();
}

export type TeamInviteEmailInput = {
  teamId: string;
  teamName: string;
  anglerName: string;
  to: string;
};

export function buildTeamInviteEmail(input: TeamInviteEmailInput): {
  to: string;
  subject: string;
  text: string;
  html: string;
  inviteUrl: string;
} {
  const inviteUrl = anglerInviteUrl(
    input.teamId,
    input.to,
    input.anglerName,
  );
  const copy = teamInviteEmailCopy({
    anglerName: input.anglerName,
    teamName: input.teamName,
    inviteUrl,
    eventName: EVENT.name,
    shortName: EVENT.shortName,
    dateLabel: EVENT.dateLabel,
    venue: EVENT.venue,
    footerScript: EVENT.footerScript,
  });

  return {
    to: input.to.trim().toLowerCase(),
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
    inviteUrl,
  };
}

export async function sendTeamInviteEmail(
  input: TeamInviteEmailInput,
): Promise<EmailDelivery & { inviteUrl: string }> {
  const message = buildTeamInviteEmail(input);
  const delivery = await sendEmail({
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  return { ...delivery, inviteUrl: message.inviteUrl };
}
