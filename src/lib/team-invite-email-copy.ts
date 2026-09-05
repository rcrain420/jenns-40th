export type TeamInviteEmailCopyInput = {
  anglerName: string;
  teamName: string;
  inviteUrl: string;
  eventName: string;
  shortName: string;
  dateLabel: string;
  venue: string;
  footerScript: string;
};

export function teamInviteEmailCopy(
  input: TeamInviteEmailCopyInput,
): { subject: string; text: string; html: string } {
  const first = input.anglerName.trim().split(/\s+/)[0] || "there";
  const subject = `You're invited — ${input.teamName} at Jenn's 40th`;

  const text = [
    `Hi ${first} — ${input.teamName} added you as an angler.`,
    "",
    `You're invited to ${input.shortName} — ${input.dateLabel} at ${input.venue}.`,
    "Tap the link to create an account and set a password — that hops you on the boat. After you join you can use the Livewell. Joining does not make you the captain. Later visits can sign in with that password.",
    input.inviteUrl,
    "",
    "Need the shared invite instead? Ask your teammate to copy it from My team. Adults without email still create an account from that link. Kids must be registered by a parent or guardian — they do not get a create-account invite.",
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
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">${escapeHtml(input.teamName)} invited you.</h1>
          <p style="margin:0 0 16px;line-height:1.5;">
            Hi ${escapeHtml(first)} — you're on the roster for ${escapeHtml(input.dateLabel)} at ${escapeHtml(input.venue)}.
          </p>
          <p style="margin:0 0 20px;line-height:1.5;">
            One tap creates your account and sets a password, puts you on the boat, and opens the Livewell. Joining does not make you the captain. Later visits can sign in with that password.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${escapeHtml(input.inviteUrl)}" style="display:inline-block;background:#16354f;color:#f6ecd6;padding:12px 20px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;">
              Join the boat
            </a>
          </p>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#16354f;">
            If the button is shy, paste this link: ${escapeHtml(input.inviteUrl)}
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#16354f;">
            Need the shared invite instead? Ask your teammate to copy it from My team. Adults without email still create an account from that link. Kids must be registered by a parent or guardian — they do not get a create-account invite.
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
