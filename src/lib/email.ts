import { EVENT } from "./config";
import { getAppUrl } from "./safe-path";

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

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Official-ish Tournament <noreply@officialishfishingtournament.com>"
  );
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
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

async function sendMail(opts: OutboundEmail): Promise<void> {
  const result = await sendEmail(opts);
  if (result.error === "provider_error") {
    throw new Error("Could not send email");
  }
}

function buttonHtml(href: string, label: string): string {
  return `<p style="margin:28px 0"><a href="${href}" style="background:#16354f;color:#f6ecd6;text-decoration:none;padding:14px 22px;font-family:system-ui,sans-serif;font-weight:700;font-size:16px;border-radius:6px;display:inline-block">${label}</a></p>`;
}

export function confirmEmailUrl(token: string, next?: string): string {
  const url = new URL("/api/auth/confirm", getAppUrl());
  url.searchParams.set("token", token);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export function resetPasswordUrl(token: string, next?: string): string {
  const url = new URL("/reset-password", getAppUrl());
  url.searchParams.set("token", token);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export async function sendConfirmEmail(opts: {
  to: string;
  name: string;
  token: string;
  next?: string;
}): Promise<void> {
  const href = confirmEmailUrl(opts.token, opts.next);
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  await sendMail({
    to: opts.to,
    subject: `Confirm your ${EVENT.brandNav} account`,
    text: `Hi ${first},\n\nTap this link to start posting on the Livewell:\n${href}\n\nThis link expires in 48 hours.`,
    html: `<p>Hi ${first},</p><p>Tap the button to confirm your email and start posting on the Livewell.</p>${buttonHtml(href, "Confirm my email")}<p style="color:#666;font-size:13px">This link expires in 48 hours. If you didn’t create an account, you can ignore this.</p>`,
  });
}

export async function sendResetEmail(opts: {
  to: string;
  name: string;
  token: string;
  next?: string;
}): Promise<void> {
  const href = resetPasswordUrl(opts.token, opts.next);
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  await sendMail({
    to: opts.to,
    subject: `Reset your ${EVENT.brandNav} password`,
    text: `Hi ${first},\n\nTap this link to choose a new password:\n${href}\n\nThis link expires in 1 hour.`,
    html: `<p>Hi ${first},</p><p>Tap the button to choose a new password.</p>${buttonHtml(href, "Choose a new password")}<p style="color:#666;font-size:13px">This link expires in 1 hour. If you didn’t ask for a reset, you can ignore this.</p>`,
  });
}
