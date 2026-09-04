/** HTTPS profile-photo URLs from Google (and similarly shaped OAuth pictures). */

const MAX_AVATAR_URL_LEN = 2048;
const GOOGLE_PHOTO_HOST = /(^|\.)googleusercontent\.com$/i;

export function sanitizeAvatarUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_AVATAR_URL_LEN) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

/** next/image remotePatterns currently allow Google-hosted photos. */
export function isAllowedAvatarHost(url: string): boolean {
  try {
    return GOOGLE_PHOTO_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function avatarImageSrc(imageUrl: string | null | undefined): string | null {
  const clean = sanitizeAvatarUrl(imageUrl);
  if (!clean || !isAllowedAvatarHost(clean)) return null;
  return clean;
}
