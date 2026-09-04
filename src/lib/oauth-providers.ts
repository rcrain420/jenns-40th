import { sanitizeAvatarUrl } from "./avatar";
import {
  facebookCredentials,
  googleCredentials,
  type OAuthErrorCode,
  type OAuthProvider,
} from "./oauth";

export type OAuthProfile = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  name: string;
  imageUrl: string | null;
};

type TokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; code: OAuthErrorCode };

type ProfileResult =
  | { ok: true; profile: OAuthProfile }
  | { ok: false; code: OAuthErrorCode };

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const data = (await res.json()) as unknown;
    if (data && typeof data === "object") {
      return data as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function exchangeGoogleToken(input: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResult> {
  const creds = googleCredentials();
  if (!creds) return { ok: false, code: "google_unavailable" };

  const body = new URLSearchParams({
    code: input.code,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
    code_verifier: input.codeVerifier,
  });

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await readJson(res);
    const accessToken = asString(data.access_token);
    if (!res.ok || !accessToken) return { ok: false, code: "failed" };
    return { ok: true, accessToken };
  } catch (err) {
    console.error("Google token exchange failed", err);
    return { ok: false, code: "failed" };
  }
}

async function exchangeFacebookToken(input: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResult> {
  const creds = facebookCredentials();
  if (!creds) return { ok: false, code: "facebook_unavailable" };

  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("client_id", creds.appId);
  url.searchParams.set("client_secret", creds.appSecret);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("code", input.code);
  url.searchParams.set("code_verifier", input.codeVerifier);

  try {
    const res = await fetch(url);
    const data = await readJson(res);
    const accessToken = asString(data.access_token);
    if (!res.ok || !accessToken) return { ok: false, code: "failed" };
    return { ok: true, accessToken };
  } catch (err) {
    console.error("Facebook token exchange failed", err);
    return { ok: false, code: "failed" };
  }
}

async function fetchGoogleProfile(
  accessToken: string,
): Promise<ProfileResult> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await readJson(res);
    if (!res.ok) return { ok: false, code: "failed" };
    const email = asString(data.email).toLowerCase();
    const providerUserId = asString(data.sub);
    if (!providerUserId) return { ok: false, code: "failed" };
    if (!email || !email.includes("@")) {
      return { ok: false, code: "missing_email" };
    }
    return {
      ok: true,
      profile: {
        provider: "google",
        providerUserId,
        email,
        name: asString(data.name) || email.split("@")[0] || "Angler",
        imageUrl: sanitizeAvatarUrl(data.picture),
      },
    };
  } catch (err) {
    console.error("Google profile fetch failed", err);
    return { ok: false, code: "failed" };
  }
}

async function fetchFacebookProfile(
  accessToken: string,
): Promise<ProfileResult> {
  const url = new URL("https://graph.facebook.com/v21.0/me");
  url.searchParams.set("fields", "id,name,email");
  url.searchParams.set("access_token", accessToken);

  try {
    const res = await fetch(url);
    const data = await readJson(res);
    if (!res.ok) return { ok: false, code: "failed" };
    const email = asString(data.email).toLowerCase();
    const providerUserId = asString(data.id);
    if (!providerUserId) return { ok: false, code: "failed" };
    if (!email || !email.includes("@")) {
      return { ok: false, code: "missing_email" };
    }
    return {
      ok: true,
      profile: {
        provider: "facebook",
        providerUserId,
        email,
        name: asString(data.name) || email.split("@")[0] || "Angler",
        imageUrl: null,
      },
    };
  } catch (err) {
    console.error("Facebook profile fetch failed", err);
    return { ok: false, code: "failed" };
  }
}

export async function fetchOAuthProfile(
  provider: OAuthProvider,
  input: { code: string; redirectUri: string; codeVerifier: string },
): Promise<ProfileResult> {
  const token =
    provider === "google"
      ? await exchangeGoogleToken(input)
      : await exchangeFacebookToken(input);
  if (!token.ok) return token;
  return provider === "google"
    ? fetchGoogleProfile(token.accessToken)
    : fetchFacebookProfile(token.accessToken);
}
