export type RegistrationConfirmationCopyInput = {
  teamName: string;
  amountLabel: string;
  unlockUrl: string;
  venmoHandle: string;
  venmoUrl: string;
  eventName: string;
  shortName: string;
  dateLabel: string;
  venue: string;
  footerScript: string;
};

export function registrationConfirmationCopy(
  input: RegistrationConfirmationCopyInput,
): { subject: string; text: string; html: string } {
  const subject = `You're on the list — ${input.teamName} at Jenn's 40th`;

  const text = [
    `Hey captain of ${input.teamName},`,
    "",
    `You're registered for ${input.shortName} — ${input.dateLabel} at ${input.venue}.`,
    `Amount due: ${input.amountLabel}. Venmo ${input.venmoHandle} and put your team name in the note so we can match it.`,
    "",
    "One tap below unlocks the Livewell on this device so you can log catches, leave comments, and try AI team names. No PIN required.",
    input.unlockUrl,
    "",
    "The link stays good for two weeks. Lost the email or signing up at Friday's captain's meeting? Ask an organizer for the event PIN — that still works.",
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
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">You're on the list, ${escapeHtml(input.teamName)}.</h1>
          <p style="margin:0 0 16px;line-height:1.5;">
            ${escapeHtml(input.dateLabel)} at ${escapeHtml(input.venue)}. Amount due:
            <strong>${escapeHtml(input.amountLabel)}</strong>. Venmo
            <a href="${escapeHtml(input.venmoUrl)}" style="color:#c1362c;">${escapeHtml(input.venmoHandle)}</a>
            and put your team name in the note so we can match it.
          </p>
          <p style="margin:0 0 20px;line-height:1.5;">
            One tap unlocks the Livewell on this device — log catches, leave comments, and try AI team names. No PIN required.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${escapeHtml(input.unlockUrl)}" style="display:inline-block;background:#16354f;color:#f6ecd6;padding:12px 20px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;">
              Unlock catch logging
            </a>
          </p>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#16354f;">
            If the button is shy, paste this link: ${escapeHtml(input.unlockUrl)}
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#16354f;">
            The link stays good for two weeks. Lost the email or signing up Friday night? Ask an organizer for the event PIN — that still works.
          </p>
          <p style="margin:24px 0 0;font-size:18px;">${escapeHtml(input.footerScript)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
