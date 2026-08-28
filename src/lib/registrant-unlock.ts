import { normalizeUnlockEmail } from "./event-unlock-token";
import {
  OPEN_MY_TEAM_ACCESS,
  OPEN_MY_TEAM_NEXT,
} from "./open-my-team-access";

export type RegistrantClaim = {
  teamId: string;
  email: string;
};

export type OpenMyTeamUnlockPlan = {
  location: string;
  grantEventUnlock: true;
  rememberClaim: true;
  setUserSession: false;
};

/** First tap: Create account / set a password. Never Sign in. Never /catches. */
export function openMyTeamLandingPath(input: { email: string }): string {
  const params = new URLSearchParams({
    mode: "signup",
    next: OPEN_MY_TEAM_NEXT,
    email: normalizeUnlockEmail(input.email),
  });
  return `/login?${params.toString()}`;
}

export function planOpenMyTeamUnlock(input: {
  teamId: string;
  email: string;
}): OpenMyTeamUnlockPlan {
  return {
    location: openMyTeamLandingPath({ email: input.email }),
    grantEventUnlock: OPEN_MY_TEAM_ACCESS.grantsEventUnlock,
    rememberClaim: true,
    setUserSession: OPEN_MY_TEAM_ACCESS.silentUserSession,
  };
}

export function registrantClaimMatches(
  claim: RegistrantClaim | null | undefined,
  email: string,
): claim is RegistrantClaim {
  if (!claim?.teamId || !claim.email) return false;
  return normalizeUnlockEmail(claim.email) === normalizeUnlockEmail(email);
}
