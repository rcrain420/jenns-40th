/**
 * Product contract 2026-08-28: after a successful join, the account has
 * full site features. That means the event cookie and no confirm-email
 * post gate. Join still does not make them captain
 * and does not add a paid Angler roster row — those stay off grantSiteAccessAfterJoin.
 */
export const JOIN_SITE_ACCESS = {
  grantsEventUnlock: true,
  verifiesEmail: true,
  makesCaptain: false,
  addsPaidRoster: false,
} as const;
