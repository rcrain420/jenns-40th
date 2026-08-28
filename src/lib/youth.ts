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
  "The guided captain and DIY primary contact must be 18 or older. Youth anglers belong on the fishing roster, not in these fields.";

export const YOUTH_INVITE_SKIP_ERROR =
  "Youth anglers do not get a Join the boat / create-account invite. Parent login is the login.";

export function hasYouthAngler(
  anglers: Array<{ isYouth?: boolean | null }>,
): boolean {
  return anglers.some((angler) => angler.isYouth === true);
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
