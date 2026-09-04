/** Resolve a path or URL to an absolute http(s) URL for copy/share. */
export function resolveShareUrl(url: string, origin?: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = origin?.trim().replace(/\/$/, "");
  if (!base) return trimmed;
  try {
    return new URL(trimmed, `${base}/`).toString();
  } catch {
    return trimmed;
  }
}

export function isUsableShareUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}
