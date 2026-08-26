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

export function getAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
