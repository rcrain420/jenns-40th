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
  "If you add a guided captain or DIY primary contact, they must be 18 or older. Youth anglers are not the captain or boat contact. Kids may tag along on a boat or enter RowRide from land. You can add a captain later on My team.";

export const YOUTH_INVITE_SKIP_ERROR =
  "Youth anglers do not get a Join the boat / create-account invite. Parent login is the login.";

/** Locked product rule: youth out of main stringer / main pot; in on side pots + RowRide. */
export const YOUTH_MAIN_STRINGER_RULE =
  "Youth anglers do not participate in the main tournament stringer or main pot competition.";

export const YOUTH_SIDE_POT_RULE =
  "Youth attached to a boat that entered paid team side pots may count on those team side pots. Land-only kids with no boat are RowRide-only.";

export const YOUTH_ROWRIDE_RULE =
  "They still have their own host-funded RowRide Youth Angler Tournament — heaviest qualifying fish, no entry fee.";

export const YOUTH_BOAT_SEAT_RULE =
  "Youth do not take one of a boat’s 1–4 adult fishing seats and do not change the $300 boat entry.";

export const YOUTH_LAND_RULE =
  "Kids are not required to be on a boat. They may fish from land, or optionally tag along with adults on a registered boat.";

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
