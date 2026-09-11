/** Locked kids / youth roster copy and helpers. Leaf module for Node tests. */

export const YOUTH_CHECKBOX_LABEL = "17 or under";

export const YOUTH_EMAIL_HELPER =
  "Kids can use a parent’s email. They do not need their own account.";

export const YOUTH_ATTESTATION_LABEL =
  "I am the parent or legal guardian of each youth angler listed. I am registering them for this tournament, and I understand photos of registered youth may appear on this site.";

export const YOUTH_ATTESTATION_ERROR =
  "A parent or legal guardian must attest when registering a youth angler.";

export const LICENSE_CONFIRM_LABEL =
  "I confirm each adult angler and any 17-year-old on this team has a valid Texas fishing license. Younger children generally do not need one.";

export const LICENSE_CONFIRM_ERROR =
  "Confirm licenses for adults and 17-year-olds. Younger children generally do not need one.";

export const CAPTAIN_CONTACT_ADULT_NOTE =
  "If you add a guided captain or DIY primary contact, they must be 18 or older. Youth anglers are not the captain or boat contact. Kids register separately for RowRide — they are not added to a boat roster. They may fish from land or by boat. You can add a captain later on My team.";

export const YOUTH_INVITE_SKIP_ERROR =
  "Youth anglers do not get a Join the boat / create-account invite. Parent login is the login.";

/** Locked product rule: youth out of main stringer / main pot; in on side pots + RowRide. */
export const YOUTH_MAIN_STRINGER_RULE =
  "Youth anglers do not participate in the main tournament stringer or main pot competition.";

export const YOUTH_SIDE_POT_RULE =
  "RowRide kids are on their own RowRide entry. They do not join a boat roster and do not count on a boat team’s paid side pots.";

export const YOUTH_ROWRIDE_RULE =
  "They still have their own host-funded RowRide Youth Angler Tournament — heaviest qualifying fish, no entry fee.";

export const YOUTH_BOAT_SEAT_RULE =
  "A boat’s 1–4 fishing seats are adults only. Youth do not take one of those seats and do not change the $300 boat entry. Kids register separately for RowRide — they are not added to a boat roster. They may fish from land or by boat. If they tag along on someone’s boat, ask the captain or guide first — guides often prefer no more than four anglers.";

export const YOUTH_LAND_RULE =
  "Register for RowRide separately. Kids may fish from land or by boat. They are not added to a boat roster.";

export const YOUTH_SEPARATE_REGISTER = YOUTH_LAND_RULE;

export const YOUTH_COMPETITION_POLICY = [
  YOUTH_MAIN_STRINGER_RULE,
  YOUTH_BOAT_SEAT_RULE,
  YOUTH_LAND_RULE,
  YOUTH_SIDE_POT_RULE,
  YOUTH_ROWRIDE_RULE,
].join(" ");

export function isYouthAngler(angler: { isYouth?: boolean | null }): boolean {
  return angler.isYouth === true;
}

/** Main tournament stringer / main pot: registered adult (non-youth) anglers only. */
export function isMainStringerEligible(angler: {
  isYouth?: boolean | null;
}): boolean {
  return !isYouthAngler(angler);
}

export function mainStringerEligibleAnglers<
  T extends { isYouth?: boolean | null },
>(anglers: T[]): T[] {
  return anglers.filter(isMainStringerEligible);
}

export function hasYouthAngler(
  anglers: Array<{ isYouth?: boolean | null }>,
): boolean {
  return anglers.some(isYouthAngler);
}

export function youthGuardianAttestationMissing(
  anglers: Array<{ isYouth?: boolean | null }>,
  attested: boolean | undefined,
): boolean {
  return hasYouthAngler(anglers) && attested !== true;
}

/** Same gate used by register and roster PATCH. */
export function youthAttestationResult(
  anglers: Array<{ isYouth?: boolean | null }>,
  attested: boolean | undefined,
): { ok: true } | { ok: false; error: string } {
  if (youthGuardianAttestationMissing(anglers, attested)) {
    return { ok: false, error: YOUTH_ATTESTATION_ERROR };
  }
  return { ok: true };
}
