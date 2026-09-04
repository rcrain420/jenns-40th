import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-chars!!";

const {
  OAUTH_LOCAL_ORIGIN,
  OAUTH_MARKS_EMAIL_VERIFIED,
  OAUTH_PRODUCTION_ORIGIN,
  facebookAuthorizationUrl,
  googleAuthorizationUrl,
  oauthCallbackPath,
  oauthDeniedCode,
  oauthFailureLoginPath,
  oauthProvidersStatus,
  oauthRedirectUri,
  oauthStartDecision,
  oauthStartPath,
  planOAuthUserLink,
} = await import("./oauth.ts");
const {
  hasPasswordHash,
  oauthErrorMessage,
  SOCIAL_ONLY_LOGIN_ERROR,
} = await import("./oauth-errors.ts");
const { JOIN_THE_BOAT, joinTheBoatAuthMode } = await import("./join-the-boat.ts");

const emptyEnv = {
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  FACEBOOK_APP_ID: "",
  FACEBOOK_APP_SECRET: "",
};

describe("OAuth provider gate", () => {
  it("reports Google and Facebook as off without credentials", () => {
    assert.deepEqual(oauthProvidersStatus(emptyEnv), {
      google: false,
      facebook: false,
    });
    assert.deepEqual(oauthProvidersStatus({}), {
      google: false,
      facebook: false,
    });
  });

  it("turns a provider on only when both env halves are set", () => {
    assert.deepEqual(
      oauthProvidersStatus({
        GOOGLE_CLIENT_ID: "gid",
        GOOGLE_CLIENT_SECRET: "gsecret",
      }),
      { google: true, facebook: false },
    );
    assert.deepEqual(
      oauthProvidersStatus({
        FACEBOOK_APP_ID: "fid",
        FACEBOOK_APP_SECRET: "fsecret",
      }),
      { google: false, facebook: true },
    );
  });

  it("sends a Google start without env vars back to login with a clear error", () => {
    const decision = oauthStartDecision("google", emptyEnv);
    assert.equal(decision.ok, false);
    if (decision.ok) throw new Error("expected Google start to fail");
    assert.equal(decision.code, "google_unavailable");

    const path = oauthFailureLoginPath({
      code: decision.code,
      next: "/catches",
    });
    assert.equal(path.startsWith("/login?"), true);
    const url = new URL(path, "http://localhost:3000");
    assert.equal(url.searchParams.get("oauthError"), "google_unavailable");
    assert.match(
      oauthErrorMessage(url.searchParams.get("oauthError")) ?? "",
      /Google sign-in is not set up yet/i,
    );
  });
});

describe("OAuth redirect URIs", () => {
  it("supports the localhost and production callback URIs", () => {
    assert.equal(
      oauthRedirectUri("http://localhost:3000", "google"),
      `${OAUTH_LOCAL_ORIGIN}/api/auth/oauth/google/callback`,
    );
    assert.equal(
      oauthRedirectUri("http://127.0.0.1:3000", "facebook"),
      `${OAUTH_LOCAL_ORIGIN}/api/auth/oauth/facebook/callback`,
    );
    assert.equal(
      oauthRedirectUri("https://officialishfishingtournament.com", "google"),
      `${OAUTH_PRODUCTION_ORIGIN}/api/auth/oauth/google/callback`,
    );
    assert.equal(
      oauthRedirectUri("https://officialishfishingtournament.com", "facebook"),
      `${OAUTH_PRODUCTION_ORIGIN}/api/auth/oauth/facebook/callback`,
    );
    assert.equal(oauthCallbackPath("google"), "/api/auth/oauth/google/callback");
    assert.equal(
      oauthStartPath("google", "/join?token=abc"),
      "/api/auth/oauth/google/start?next=%2Fjoin%3Ftoken%3Dabc",
    );
  });
});

describe("OAuth account linking and password login", () => {
  it("links Google or Facebook to an existing email account", () => {
    assert.equal(
      planOAuthUserLink({
        existingOAuthUserId: null,
        existingEmailUserId: "user_1",
      }),
      "link_email",
    );
    assert.equal(
      planOAuthUserLink({
        existingOAuthUserId: "user_1",
        existingEmailUserId: "user_1",
      }),
      "login_linked",
    );
    assert.equal(
      planOAuthUserLink({
        existingOAuthUserId: null,
        existingEmailUserId: null,
      }),
      "create",
    );
  });

  it("treats Google and Facebook as verified immediately", () => {
    assert.equal(OAUTH_MARKS_EMAIL_VERIFIED, true);
  });

  it("tells a social-only account to use Google/Facebook or Forgot password", () => {
    assert.equal(hasPasswordHash(null), false);
    assert.equal(hasPasswordHash(""), false);
    assert.equal(hasPasswordHash("salt:hash"), true);
    assert.match(SOCIAL_ONLY_LOGIN_ERROR, /Google or Facebook/i);
    assert.match(SOCIAL_ONLY_LOGIN_ERROR, /Forgot password/i);
  });

  it("maps a cancelled provider click to a clear denied message", () => {
    assert.equal(oauthDeniedCode("access_denied"), "denied");
    assert.match(oauthErrorMessage("denied") ?? "", /cancelled/i);
  });
});

describe("Join the boat stays on the shared auth form", () => {
  it("still opens Create account and does not invent a second auth system", () => {
    assert.equal(joinTheBoatAuthMode(), "signup");
    assert.equal(JOIN_THE_BOAT.silentUserSession, false);
    assert.equal(JOIN_THE_BOAT.authMode, "signup");
  });
});

describe("OAuth authorize URLs", () => {
  it("include PKCE and the registered redirect URI", () => {
    const google = new URL(
      googleAuthorizationUrl({
        clientId: "gid",
        redirectUri: `${OAUTH_LOCAL_ORIGIN}/api/auth/oauth/google/callback`,
        state: "abc",
        codeChallenge: "challenge",
      }),
    );
    assert.equal(google.hostname, "accounts.google.com");
    assert.equal(
      google.searchParams.get("redirect_uri"),
      `${OAUTH_LOCAL_ORIGIN}/api/auth/oauth/google/callback`,
    );
    assert.equal(google.searchParams.get("code_challenge_method"), "S256");

    const facebook = new URL(
      facebookAuthorizationUrl({
        appId: "fid",
        redirectUri: `${OAUTH_PRODUCTION_ORIGIN}/api/auth/oauth/facebook/callback`,
        state: "abc",
        codeChallenge: "challenge",
      }),
    );
    assert.equal(facebook.hostname, "www.facebook.com");
    assert.equal(
      facebook.searchParams.get("redirect_uri"),
      `${OAUTH_PRODUCTION_ORIGIN}/api/auth/oauth/facebook/callback`,
    );
  });
});
