/**
 * Product contract 2026-08-28 (Aaron): Open my team is not magic sign-in
 * and is not Join the boat.
 *
 * First tap on the confirmation / unlock link shows Create account
 * (registrant email prefilled). No user session is set until they
 * choose a password. After create they are on that boat with Livewell
 * access — no PIN, no second unlock. Later visits use that password.
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
