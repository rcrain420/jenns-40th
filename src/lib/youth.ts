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

/** Locked product rule: youth out of main stringer / main pot; never on boat side pots; optional own RowRide buy-in. */
export const YOUTH_MAIN_STRINGER_RULE =
  "Youth anglers do not participate in the main tournament stringer or main pot competition.";

export const YOUTH_SIDE_POT_RULE =
  "A kid’s fish does not count toward a boat’s paid side pots, even if the kid fishes from that boat. To enter a paid side pot, buy in on the RowRide registration — $50 per pot. The free RowRide base stays $0.";

export const YOUTH_DIVISION_HEADING = "Youth Division";

/** Host-funded RowRide trophies. Shared so home, /kids, and rules stay in sync. */
export const YOUTH_DIVISION_AWARDS = [
  { id: "redfish", name: "Biggest Redfish", place: "1st Place" },
  { id: "trout", name: "Biggest Speckled Trout", place: "1st Place" },
  { id: "trash", name: "Biggest Trash Fish", place: "1st Place" },
] as const;

export type YouthDivisionAward = (typeof YOUTH_DIVISION_AWARDS)[number];

export function youthDivisionAwardLine(award: {
  name: string;
  place: string;
}): string {
  return `${award.name} — ${award.place}`;
}

export const YOUTH_ONE_AWARD_RULE =
  "A youth angler may only win one Youth Division award. If the same kid brings in the biggest redfish and biggest trout (or any two), they take only one award and the next eligible angler takes the other so the fun spreads around.";

export const YOUTH_ONE_AWARD_ASSIGNMENT =
  "At the scale: start with the heaviest qualifying fish in each category. If one kid would win more than one award, they keep the award they win by the most — usually their heaviest fish, or the one with the biggest lead over second place. Each leftover award goes to the next heaviest qualifying fish in that category from a kid who has not already won. If two fish in the same category weigh the same, the one weighed first wins. If it is still a toss-up, the Weighmaster decides, and that call is final.";

export const YOUTH_ROWRIDE_RULE =
  "They still have their own host-funded RowRide Youth Angler Tournament — Youth Division awards for biggest redfish, biggest speckled trout, and biggest trash fish, no entry fee.";

export const YOUTH_BOAT_SEAT_RULE =
  "A boat’s 1–4 fishing seats are adults only. Youth do not take one of those seats and do not change the $300 boat entry. Kids register separately for RowRide — they are not added to a boat roster. They may fish from land or by boat. If they tag along on someone’s boat, ask the captain or guide first — guides often prefer no more than four anglers.";

export const YOUTH_LAND_RULE =
  "Register for RowRide separately. Kids may fish from land or by boat. They are not added to a boat roster.";

/** Kids path is its own product — never a boat-register CTA or boat roster add-on. */
export const YOUTH_OWN_ENTRY_RULE =
  "Kids enter RowRide on their own. Boat registration is a different product — they are not added to a boat roster.";

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

/** Home youth card line — kids (angler rows), not youth teams. */
export function youthAnglersRegisteredLabel(count: number): string {
  const noun = count === 1 ? "youth angler" : "youth anglers";
  return `RowRide: ${count} ${noun} registered`;
}

function joinYouthNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  if (names.length === 3) {
    return `${names[0]}, ${names[1]} & ${names[2]}`;
  }
  return `${names[0]} and ${names.length - 1} more`;
}

/**
 * Internal Team.teamName for YOUTH_LAND / RowRide rows. Public signup
 * does not collect a team or boat name — kids are individuals.
 */
export function youthLandDisplayName(input: {
  anglers?: Array<{ fullName?: string | null }>;
  registrantEmail?: string | null;
  teamName?: string | null;
}): string {
  const provided = input.teamName?.trim();
  if (provided) return provided;

  const names = (input.anglers ?? [])
    .map((angler) => angler.fullName?.trim())
    .filter((name): name is string => Boolean(name));
  if (names.length > 0) return `RowRide — ${joinYouthNames(names)}`;

  const local = input.registrantEmail?.trim().split("@")[0];
  if (local) return `RowRide — ${local}`;
  return "RowRide";
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
