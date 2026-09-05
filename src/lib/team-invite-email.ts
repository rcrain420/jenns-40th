import { EVENT } from "./config";
import { sendEmail, type EmailDelivery } from "./email";
import { publicAbsoluteUrl } from "./safe-path";
import { anglerInviteSharePath } from "./team-invite-code";
import { ensureTeamInviteCode } from "./team-invite";
import { teamInviteEmailCopy } from "./team-invite-email-copy";

export async function anglerInviteUrl(
  teamId: string,
  email: string,
  name?: string,
): Promise<string> {
  const { code } = await ensureTeamInviteCode(teamId);
  return publicAbsoluteUrl(anglerInviteSharePath(code, email, name));
}

export type TeamInviteEmailInput = {
  teamId: string;
  teamName: string;
  anglerName: string;
  to: string;
};

export async function buildTeamInviteEmail(input: TeamInviteEmailInput): Promise<{
  to: string;
  subject: string;
  text: string;
  html: string;
  inviteUrl: string;
}> {
  const inviteUrl = await anglerInviteUrl(
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
  const message = await buildTeamInviteEmail(input);
  const delivery = await sendEmail({
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  return { ...delivery, inviteUrl: message.inviteUrl };
}
