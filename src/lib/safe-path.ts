/** Only allow same-origin relative paths (blocks //evil.com open redirects). */
export function safeNextPath(next: unknown, fallback = "/catches"): string {
  if (typeof next !== "string") return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }
  return trimmed;
}

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || name.trim() || "there";
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Same public origin as config.getAppUrl — kept here so Node tests stay leaf-safe. */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return new URL(explicit).origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://officialishfishingtournament.com";
}

/** Turn a same-origin path into an absolute public URL for copy/share/email. */
export function publicAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path.trim())) return path.trim();
  return new URL(path, `${getAppUrl()}/`).toString();
}
