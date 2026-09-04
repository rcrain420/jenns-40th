import { NextResponse } from "next/server";
import { getOAuthSession } from "@/lib/auth";
import {
  createOAuthState,
  createPkcePair,
  facebookAuthorizationUrl,
  facebookCredentials,
  googleAuthorizationUrl,
  googleCredentials,
  oauthFailureLoginPath,
  oauthRedirectUri,
  oauthStartDecision,
} from "@/lib/oauth";
import { safeNextPath } from "@/lib/safe-path";

type RouteContext = { params: Promise<{ provider: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { provider: rawProvider } = await context.params;
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const origin = url.origin;

  const decision = oauthStartDecision(rawProvider);
  if (!decision.ok) {
    return NextResponse.redirect(
      new URL(oauthFailureLoginPath({ code: decision.code, next }), origin),
    );
  }

  const redirectUri = oauthRedirectUri(origin, decision.provider);
  const state = createOAuthState();
  const pkce = createPkcePair();

  let authorize: string;
  if (decision.provider === "google") {
    const creds = googleCredentials();
    if (!creds) {
      return NextResponse.redirect(
        new URL(
          oauthFailureLoginPath({ code: "google_unavailable", next }),
          origin,
        ),
      );
    }
    authorize = googleAuthorizationUrl({
      clientId: creds.clientId,
      redirectUri,
      state,
      codeChallenge: pkce.challenge,
    });
  } else {
    const creds = facebookCredentials();
    if (!creds) {
      return NextResponse.redirect(
        new URL(
          oauthFailureLoginPath({ code: "facebook_unavailable", next }),
          origin,
        ),
      );
    }
    authorize = facebookAuthorizationUrl({
      appId: creds.appId,
      redirectUri,
      state,
      codeChallenge: pkce.challenge,
    });
  }

  const session = await getOAuthSession();
  session.state = state;
  session.provider = decision.provider;
  session.next = next;
  session.codeVerifier = pkce.verifier;
  await session.save();

  return NextResponse.redirect(authorize);
}
