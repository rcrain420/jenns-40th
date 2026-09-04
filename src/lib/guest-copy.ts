/** Guest-facing copy when catch-photo AI sizing is unavailable. */
export const GUEST_AI_UNAVAILABLE_NOTE =
  "Estimate unavailable — edit after weigh-in if needed.";

/** OPENAI_API_KEY missing/empty on the server. Do not name the env var. */
export const GUEST_AI_MISSING_KEY_NOTE =
  "Estimate unavailable because AI isn’t configured. Size left blank (not a real guess).";

export const GUEST_AI_TIMEOUT_NOTE =
  "AI timed out looking at the photo. Size left blank — not a real guess.";

export const GUEST_AI_UNSUPPORTED_PHOTO_NOTE =
  "AI skipped this photo format. Try a JPEG or PNG from the camera.";

export const GUEST_AI_NO_IMAGE_NOTE =
  "AI could not read this photo. Try a clearer JPEG.";

export const GUEST_AI_PROVIDER_ERROR_NOTE =
  "AI guess unavailable right now. Size left blank — not a real estimate.";

/** Guest-facing copy when the shared event PIN is missing on the server. */
export const GUEST_EVENT_PIN_UNAVAILABLE =
  "Catch logging isn't available right now. Try again later, or find a host.";

/** Registration succeeded but the confirmation email did not go out. */
export const GUEST_REGISTRATION_EMAIL_FAILED =
  "We could not send the confirmation email. Use the unlock and invite links on this page — they work without mail.";

/** Registration succeeded and the confirmation email was accepted by the mailer. */
export const GUEST_REGISTRATION_EMAIL_SENT =
  "A confirmation email is on its way. The unlock and invite links below work even if the inbox is slow.";

/** Success page opened without a mail status (refresh, bookmark, or shared URL). */
export const GUEST_REGISTRATION_EMAIL_UNKNOWN =
  "If a confirmation email does not arrive, use the unlock and invite links on this page. They do not depend on mail.";

/**
 * Env-style names, "set VAR" setup hints, stack-ish debug text, and the
 * old fallback copy that leaked config instructions onto the Brag Board.
 *
 * The "set VAR" pattern is case-sensitive on the variable so a note like
 * "set the hook" stays intact.
 */
const INTERNAL_LEAKS: RegExp[] = [
  /\b[A-Z][A-Z0-9]*_(?:API_KEY|SECRET|TOKEN|PASSWORD|PIN|URL|KEY|DATABASE|BLOB)[A-Z0-9_]*\b/,
  /\b(?:OPENAI|VERCEL|DATABASE|BLOB|SESSION|ADMIN|RESEND|EVENT)_[A-Z0-9_]+\b/,
  /\b[Ss]et\s+[A-Z][A-Z0-9_]+\b/,
  /\bprocess\.env\b/i,
  /\bstack trace\b/i,
  /\bat\s+\S+\s+\(/,
  /AI estimation unavailable/i,
  /placeholder estimates/i,
];

/** True when guest-facing text contains env names or debug leftovers. */
export function guestCopyHasInternalLeak(text: string): boolean {
  return INTERNAL_LEAKS.some((pattern) => pattern.test(text));
}

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
  if (guestCopyHasInternalLeak(trimmed)) {
    return GUEST_AI_UNAVAILABLE_NOTE;
  }
  return trimmed;
}

/**
 * Guest line for a fallback catch. Older rows stored a generic
 * "estimate unavailable" note — show the configured-AI wording instead.
 */
export function guestFallbackAiNote(
  aiProvider: string | null | undefined,
  aiNotes: string | null | undefined,
): string | null {
  const safe = guestSafeAiNotes(aiNotes);
  if (aiProvider !== "fallback") return safe;
  if (!safe || safe === GUEST_AI_UNAVAILABLE_NOTE) {
    return GUEST_AI_MISSING_KEY_NOTE;
  }
  return safe;
}
