import { createHash, randomBytes } from "crypto";

/** Same-origin relative path only. Duplicated so this stays a Node-test leaf. */
function safeNextPath(next: unknown, fallback = "/catches"): string {
  if (typeof next !== "string") return fallback;
  const trimmed = next.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }
  return trimmed;
}

export type OAuthErrorCode =
  | "google_unavailable"
  | "facebook_unavailable"
  | "denied"
  | "failed"
  | "missing_email"
  | "invalid";

export const OAUTH_PROVIDERS = ["google", "facebook"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/** Google / Facebook accounts skip the confirm-email post gate. */
export const OAUTH_MARKS_EMAIL_VERIFIED = true;

export const OAUTH_PRODUCTION_ORIGIN =
  "https://officialishfishingtournament.com";
export const OAUTH_LOCAL_ORIGIN = "http://localhost:3000";

export type OAuthProvidersStatus = {
  google: boolean;
  facebook: boolean;
};

export type EnvLike = NodeJS.Dict<string>;

export function parseOAuthProvider(raw: string): OAuthProvider | null {
  if (raw === "google" || raw === "facebook") return raw;
  return null;
}

export function isOAuthProviderEnabled(
  provider: OAuthProvider,
  env: EnvLike = process.env,
): boolean {
  if (provider === "google") {
    return Boolean(
      env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim(),
    );
  }
  return Boolean(
    env.FACEBOOK_APP_ID?.trim() && env.FACEBOOK_APP_SECRET?.trim(),
  );
}

export function oauthProvidersStatus(
  env: EnvLike = process.env,
): OAuthProvidersStatus {
  return {
    google: isOAuthProviderEnabled("google", env),
    facebook: isOAuthProviderEnabled("facebook", env),
  };
}

export function googleCredentials(env: EnvLike = process.env) {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function facebookCredentials(env: EnvLike = process.env) {
  const appId = env.FACEBOOK_APP_ID?.trim() ?? "";
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() ?? "";
  if (!appId || !appSecret) return null;
  return { appId, appSecret };
}

export function oauthStartDecision(
  rawProvider: string,
  env: EnvLike = process.env,
):
  | { ok: true; provider: OAuthProvider }
  | { ok: false; code: OAuthErrorCode } {
  const provider = parseOAuthProvider(rawProvider);
  if (!provider) return { ok: false, code: "invalid" };
  if (!isOAuthProviderEnabled(provider, env)) {
    return {
      ok: false,
      code:
        provider === "google" ? "google_unavailable" : "facebook_unavailable",
    };
  }
  return { ok: true, provider };
}

export function oauthFailureLoginPath(input: {
  code: string;
  next?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("oauthError", input.code);
  params.set("next", safeNextPath(input.next));
  return `/login?${params.toString()}`;
}

export function oauthStartPath(
  provider: OAuthProvider,
  next?: string | null,
): string {
  const params = new URLSearchParams();
  params.set("next", safeNextPath(next));
  return `/api/auth/oauth/${provider}/start?${params.toString()}`;
}

export function oauthCallbackPath(provider: OAuthProvider): string {
  return `/api/auth/oauth/${provider}/callback`;
}

/** Origins registered on the Google / Facebook apps. */
export function resolveOAuthOrigin(requestOrigin: string): string {
  let url: URL;
  try {
    url = new URL(requestOrigin);
  } catch {
    return OAUTH_PRODUCTION_ORIGIN;
  }
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return OAUTH_LOCAL_ORIGIN;
  }
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through
    }
  }
  return OAUTH_PRODUCTION_ORIGIN;
}

export function oauthRedirectUri(
  requestOrigin: string,
  provider: OAuthProvider,
): string {
  return `${resolveOAuthOrigin(requestOrigin)}${oauthCallbackPath(provider)}`;
}

export function createOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function googleAuthorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function facebookAuthorizationUrl(input: {
  appId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.appId,
    redirect_uri: input.redirectUri,
    state: input.state,
    scope: "email,public_profile",
    response_type: "code",
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export function planOAuthUserLink(input: {
  existingOAuthUserId: string | null;
  existingEmailUserId: string | null;
}): "login_linked" | "link_email" | "create" {
  if (input.existingOAuthUserId) return "login_linked";
  if (input.existingEmailUserId) return "link_email";
  return "create";
}

export function oauthDeniedCode(
  providerError: string | null | undefined,
): OAuthErrorCode {
  if (providerError === "access_denied" || providerError === "user_denied") {
    return "denied";
  }
  if (providerError) return "failed";
  return "invalid";
}
