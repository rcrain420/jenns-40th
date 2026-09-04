/**
 * Leaf copy for Google / Facebook sign-in. Safe for client + Node tests.
 * URL query values are codes only — never free-text from the provider.
 */
export const SOCIAL_ONLY_LOGIN_ERROR =
  "This account uses Google or Facebook. Sign in that way, or use Forgot password to add one.";

export const OAUTH_ERROR_MESSAGES = {
  google_unavailable:
    "Google sign-in is not set up yet. Use email and a password.",
  facebook_unavailable:
    "Facebook sign-in is not set up yet. Use email and a password.",
  denied: "Sign-in was cancelled. You can use email and a password instead.",
  failed:
    "Could not finish Google or Facebook sign-in. Try email and a password.",
  missing_email:
    "That account did not share an email. Use another account, or sign in with email.",
  invalid: "That sign-in link is not valid. Try again.",
} as const;

export type OAuthErrorCode = keyof typeof OAUTH_ERROR_MESSAGES;

export function oauthErrorMessage(
  code: string | null | undefined,
): string | null {
  if (!code) return null;
  if (code in OAUTH_ERROR_MESSAGES) {
    return OAUTH_ERROR_MESSAGES[code as OAuthErrorCode];
  }
  return OAUTH_ERROR_MESSAGES.failed;
}

export function hasPasswordHash(
  passwordHash: string | null | undefined,
): boolean {
  return Boolean(passwordHash && passwordHash.length > 0);
}
