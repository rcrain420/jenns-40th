export type CaptainInviteEmailCopyInput = {
  captainName: string;
  teamName: string;
  inviteUrl: string;
  eventName: string;
  shortName: string;
  dateLabel: string;
  venue: string;
  footerScript: string;
};

export function captainInviteEmailCopy(
  input: CaptainInviteEmailCopyInput,
): { subject: string; text: string; html: string } {
  const first = input.captainName.trim().split(/\s+/)[0] || "there";
  const subject = `You're invited — ${input.teamName} at Jenn's 40th`;

  const text = [
    `Hi ${first} — ${input.teamName} added you as captain.`,
    "",
    `You're invited to ${input.shortName} — ${input.dateLabel} at ${input.venue}.`,
    "Tap the link to create an account or sign in with Google — that hops you on the boat. After you join you can see the Livewell, Teams, and My Team. Captain login is not a $75 angler seat.",
    input.inviteUrl,
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
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">${escapeHtml(input.teamName)} invited you as captain.</h1>
          <p style="margin:0 0 16px;line-height:1.5;">
            Hi ${escapeHtml(first)} — sign in to see the boat for ${escapeHtml(input.dateLabel)} at ${escapeHtml(input.venue)}.
          </p>
          <p style="margin:0 0 20px;line-height:1.5;">
            One tap creates your account or continues with Google, puts you on the boat, and opens the Livewell. Captain login is not a $75 angler seat. Later visits can sign in the same way.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${escapeHtml(input.inviteUrl)}" style="display:inline-block;background:#16354f;color:#f6ecd6;padding:12px 20px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;">
              Join the boat
            </a>
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#16354f;">
            If the button is shy, paste this link: ${escapeHtml(input.inviteUrl)}
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
