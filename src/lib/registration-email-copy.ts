export type RegistrationConfirmationCopyInput = {
  teamName: string;
  amountLabel: string;
  teamUrl: string;
  venmoHandle: string;
  venmoUrl: string;
  eventName: string;
  shortName: string;
  dateLabel: string;
  venue: string;
  footerScript: string;
  adultSeatFeeLabel: string;
  paidSeatCount?: number;
  youthSeatCount?: number;
};

export function registrationConfirmationCopy(
  input: RegistrationConfirmationCopyInput,
): { subject: string; text: string; html: string } {
  const subject = `You're registered — ${input.teamName} at Jenn's 40th`;
  const amountLine = amountDueLine(input);
  const inviteLine =
    "Open My Team to invite your crew — copy the share link, or add an email on an adult seat to send them Join the boat.";

  const text = [
    `Hey — ${input.teamName} is registered.`,
    "",
    `You're in for ${input.shortName} — ${input.dateLabel} at ${input.venue}.`,
    `Next step: Venmo ${input.venmoHandle} for entry. ${amountLine} Put your team name in the note so we can match it.`,
    input.venmoUrl,
    "",
    inviteLine,
    input.teamUrl,
    "",
    input.footerScript,
    input.eventName,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6ecd6;color:#16354f;font-family:Georgia,serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr>
        <td>
          <p style="margin:0 0 8px;letter-spacing:0.12em;text-transform:uppercase;font-size:12px;">${escapeHtml(input.shortName)}</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">${escapeHtml(input.teamName)} is registered.</h1>
          <p style="margin:0 0 16px;line-height:1.5;">
            You're in for ${escapeHtml(input.dateLabel)} at ${escapeHtml(input.venue)}.
          </p>
          <p style="margin:0 0 16px;line-height:1.5;">
            Next step: Venmo
            <a href="${escapeHtml(input.venmoUrl)}" style="color:#c1362c;">${escapeHtml(input.venmoHandle)}</a>
            for entry. ${escapeHtml(amountLine)} Put your team name in the note so we can match it.
          </p>
          <p style="margin:0 0 20px;line-height:1.5;">
            ${escapeHtml(inviteLine)}
          </p>
          <p style="margin:0 0 24px;">
            <a href="${escapeHtml(input.teamUrl)}" style="display:inline-block;background:#16354f;color:#f6ecd6;padding:12px 20px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;">
              Open My Team
            </a>
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#16354f;">
            If the button is shy, paste this link: ${escapeHtml(input.teamUrl)}
          </p>
          <p style="margin:24px 0 0;font-size:18px;">${escapeHtml(input.footerScript)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export function amountDueLine(input: {
  amountLabel: string;
  adultSeatFeeLabel: string;
  paidSeatCount?: number;
  youthSeatCount?: number;
}): string {
  const kidsNote = `Kids are free; ${input.adultSeatFeeLabel} covers each adult seat.`;
  if (input.paidSeatCount == null) {
    return `Amount due: ${input.amountLabel}. ${kidsNote}`;
  }
  const adultWord = input.paidSeatCount === 1 ? "seat" : "seats";
  const youthCount = input.youthSeatCount ?? 0;
  const youthBit =
    youthCount > 0
      ? `; ${youthCount} youth ${youthCount === 1 ? "seat is" : "seats are"} free`
      : "";
  return `Amount due: ${input.amountLabel} (${input.paidSeatCount} adult ${adultWord}${youthBit}). ${kidsNote}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
