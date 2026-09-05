/**
 * Product contract 2026-08-28 (Aaron): Open my team is not magic sign-in
 * and is not Join the boat.
 *
 * First tap on the confirmation / unlock link shows Create account
 * (registrant email prefilled) on the shared Google / Facebook / email
 * form. No user session is set until they finish that form. After
 * create they are on that boat with Livewell access. Later visits use
 * the same sign-in.
 *
 * Leaf module so Node tests can import it without extension rewriting.
 */
export const OPEN_MY_TEAM_ACCESS = {
  firstTap: "create-account",
  silentUserSession: false,
  grantsEventUnlock: true,
  verifiesEmailAfterCreate: true,
  makesCaptain: false,
  addsPaidRoster: false,
} as const;

export const OPEN_MY_TEAM_NEXT = "/team";

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** First tap: Create account / set a password. Never Sign in. Never /catches. */
export function openMyTeamLandingPath(input: { email: string }): string {
  const params = new URLSearchParams({
    mode: "signup",
    next: OPEN_MY_TEAM_NEXT,
    email: normalizeEmail(input.email),
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
  return normalizeEmail(claim.email) === normalizeEmail(email);
}
