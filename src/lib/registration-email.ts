import { EVENT, VENMO_HANDLE, getAppUrl, getVenmoUrl } from "./config";
import { sendEmail, type EmailDelivery } from "./email";
import { issueEventUnlockToken } from "./event-unlock-token";
import { formatUsd } from "./money";
import { registrationConfirmationCopy } from "./registration-email-copy";

export type RegistrationConfirmationInput = {
  teamId: string;
  teamName: string;
  amountDueCents: number;
  registrantEmail: string;
  token?: string;
  now?: Date;
};

export type RegistrationConfirmationMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  unlockUrl: string;
  token: string;
};

export function buildEventUnlockUrl(token: string): string {
  const url = new URL("/unlock", `${getAppUrl()}/`);
  url.searchParams.set("token", token);
  return url.toString();
}

export function buildRegistrationConfirmation(
  input: RegistrationConfirmationInput,
): RegistrationConfirmationMessage {
  const token =
    input.token ??
    issueEventUnlockToken({
      teamId: input.teamId,
      email: input.registrantEmail,
      now: input.now,
    }).token;
  const unlockUrl = buildEventUnlockUrl(token);
  const copy = registrationConfirmationCopy({
    teamName: input.teamName,
    amountLabel: formatUsd(input.amountDueCents),
    unlockUrl,
    venmoHandle: VENMO_HANDLE,
    venmoUrl: getVenmoUrl(),
    eventName: EVENT.name,
    shortName: EVENT.shortName,
    dateLabel: EVENT.dateLabel,
    venue: EVENT.venue,
    footerScript: EVENT.footerScript,
  });

  return {
    to: input.registrantEmail.trim(),
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
    unlockUrl,
    token,
  };
}

export async function sendRegistrationConfirmation(
  input: RegistrationConfirmationInput,
): Promise<EmailDelivery & { unlockUrl: string }> {
  const message = buildRegistrationConfirmation(input);
  const delivery = await sendEmail({
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  return { ...delivery, unlockUrl: message.unlockUrl };
}
