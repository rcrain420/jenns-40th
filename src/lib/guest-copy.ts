/** Guest-facing copy when catch-photo AI sizing is unavailable. */
export const GUEST_AI_UNAVAILABLE_NOTE =
  "Estimate unavailable — edit after weigh-in if needed.";

/** Guest-facing copy when the shared event PIN is missing on the server. */
export const GUEST_EVENT_PIN_UNAVAILABLE =
  "Catch logging isn't available right now. Try again later, or find a host.";

/**
 * Env-style names, "set VAR" setup hints, stack-ish debug text, and the
 * old fallback copy that leaked config instructions onto the Brag Board.
 *
 * The "set VAR" pattern is case-sensitive on the variable so a note like
 * "set the hook" stays intact.
 */
const INTERNAL_LEAKS: RegExp[] = [
  /\b[A-Z][A-Z0-9]*_(?:API_KEY|SECRET|TOKEN|PASSWORD|PIN|URL|KEY|DATABASE|BLOB)[A-Z0-9_]*\b/,
  /\b(?:OPENAI|VERCEL|DATABASE|BLOB|SESSION|ADMIN)_[A-Z0-9_]+\b/,
  /\b[Ss]et\s+[A-Z][A-Z0-9_]+\b/,
  /\bprocess\.env\b/i,
  /\bstack trace\b/i,
  /\bat\s+\S+\s+\(/,
  /AI estimation unavailable/i,
  /placeholder estimates/i,
];

/**
 * Rewrite stored or generated AI notes so public pages never show config
 * errors, env var names, or debug strings. Safe notes pass through.
 */
export function guestSafeAiNotes(
  notes: string | null | undefined,
): string | null {
  if (notes == null) return null;
  const trimmed = notes.trim();
  if (!trimmed) return null;
  if (INTERNAL_LEAKS.some((pattern) => pattern.test(trimmed))) {
    return GUEST_AI_UNAVAILABLE_NOTE;
  }
  return trimmed;
}
