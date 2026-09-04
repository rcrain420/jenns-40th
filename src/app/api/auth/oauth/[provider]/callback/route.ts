import { NextResponse } from "next/server";
import {
  clearRegistrantClaim,
  getOAuthSession,
  getRegistrantClaim,
  setLoggedInUser,
} from "@/lib/auth";
import {
  oauthDeniedCode,
  oauthFailureLoginPath,
  oauthRedirectUri,
  parseOAuthProvider,
} from "@/lib/oauth";
import { fetchOAuthProfile } from "@/lib/oauth-providers";
import { registrantClaimMatches } from "@/lib/open-my-team-access";
import { afterAuthPath, userHasRegisteredTeam } from "@/lib/register-logged-in";
import { safeNextPath } from "@/lib/safe-path";
import { loginWithOAuth } from "@/lib/users";

type RouteContext = { params: Promise<{ provider: string }> };

function failRedirect(
  origin: string,
  code: string,
  next: string,
) {
  return NextResponse.redirect(
    new URL(oauthFailureLoginPath({ code, next }), origin),
  );
}

export async function GET(request: Request, context: RouteContext) {
  const { provider: rawProvider } = await context.params;
  const url = new URL(request.url);
  const origin = url.origin;
  const provider = parseOAuthProvider(rawProvider);

  const session = await getOAuthSession();
  const next = safeNextPath(session.next ?? url.searchParams.get("next"));

  if (!provider) {
    await session.destroy();
    return failRedirect(origin, "invalid", next);
  }

  const providerError = url.searchParams.get("error");
  if (providerError) {
    await session.destroy();
    return failRedirect(origin, oauthDeniedCode(providerError), next);
  }

  const code = url.searchParams.get("code")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  if (
    !code ||
    !state ||
    !session.state ||
    !session.codeVerifier ||
    session.provider !== provider ||
    session.state !== state
  ) {
    await session.destroy();
    return failRedirect(origin, "invalid", next);
  }

  const codeVerifier = session.codeVerifier;
  await session.destroy();

  const profile = await fetchOAuthProfile(provider, {
    code,
    redirectUri: oauthRedirectUri(origin, provider),
    codeVerifier,
  });
  if (!profile.ok) {
    return failRedirect(origin, profile.code, next);
  }

  const registrantClaim = await getRegistrantClaim();
  const result = await loginWithOAuth({
    ...profile.profile,
    registrantClaim,
  });
  if (!result.ok) {
    return failRedirect(origin, result.code ?? "failed", next);
  }

  if (registrantClaimMatches(registrantClaim, result.user.email)) {
    await clearRegistrantClaim();
  }
  await setLoggedInUser(result.user.id);
  const dest = afterAuthPath({
    next,
    hasTeam: userHasRegisteredTeam(result.user),
  });
  return NextResponse.redirect(new URL(dest, origin));
}
