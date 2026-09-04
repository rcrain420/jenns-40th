import {
  EVENT,
  FEE_PER_ANGLER_CENTS,
  VENMO_HANDLE,
  getVenmoUrl,
} from "./config";
import { sendEmail, type EmailDelivery } from "./email";
import { formatUsd, formatUsdWhole } from "./money";
import { OPEN_MY_TEAM_NEXT } from "./open-my-team-access";
import { registrationConfirmationCopy } from "./registration-email-copy";
import { publicAbsoluteUrl } from "./safe-path";

export type RegistrationConfirmationInput = {
  teamId: string;
  teamName: string;
  amountDueCents: number;
  registrantEmail: string;
  paidSeatCount?: number;
  youthSeatCount?: number;
};

export type RegistrationConfirmationMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  teamUrl: string;
};

export function buildTeamPageUrl(): string {
  return publicAbsoluteUrl(OPEN_MY_TEAM_NEXT);
}

export function buildRegistrationConfirmation(
  input: RegistrationConfirmationInput,
): RegistrationConfirmationMessage {
  const teamUrl = buildTeamPageUrl();
  const copy = registrationConfirmationCopy({
    teamName: input.teamName,
    amountLabel: formatUsd(input.amountDueCents),
    teamUrl,
    venmoHandle: VENMO_HANDLE,
    venmoUrl: getVenmoUrl(),
    eventName: EVENT.name,
    shortName: EVENT.shortName,
    dateLabel: EVENT.dateLabel,
    venue: EVENT.venue,
    footerScript: EVENT.footerScript,
    adultSeatFeeLabel: formatUsdWhole(FEE_PER_ANGLER_CENTS),
    paidSeatCount: input.paidSeatCount,
    youthSeatCount: input.youthSeatCount,
  });

  return {
    to: input.registrantEmail.trim(),
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
    teamUrl,
  };
}

export async function sendRegistrationConfirmation(
  input: RegistrationConfirmationInput,
): Promise<EmailDelivery & { teamUrl: string }> {
  const message = buildRegistrationConfirmation(input);
  const delivery = await sendEmail({
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  return { ...delivery, teamUrl: message.teamUrl };
}
