export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailDelivery = {
  delivered: boolean;
  provider?: "resend";
  error?: "not_configured" | "provider_error";
};

/**
 * Deliver mail through the provider already configured in the environment.
 * Resend is used when RESEND_API_KEY is present — no mock transport.
 */
export async function sendEmail(message: OutboundEmail): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(
      `[email] no delivery provider configured; skipped "${message.subject}" to ${message.to}`,
    );
    return { delivered: false, error: "not_configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    "Official-ish Tournament <noreply@officialishfishingtournament.com>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[email] provider rejected send", response.status, detail);
    return { delivered: false, provider: "resend", error: "provider_error" };
  }

  return { delivered: true, provider: "resend" };
}
