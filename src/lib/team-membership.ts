/**
 * Product: a parent may be on one BOAT and also registrant / member of
 * YOUTH_LAND (RowRide) entries they own. Two boats are still forbidden.
 * Leaf module so Node tests can import it without a database.
 */

export const ALREADY_ON_ANOTHER_BOAT = "You’re already on another boat.";
const YOUTH_LAND = "YOUTH_LAND";

export type TeamMembershipRef = {
  teamId: string;
  entryKind?: string | null;
};

export type TeamMembershipDecision =
  | { ok: true; already: boolean }
  | { ok: false; reason: "other-boat"; error: string };

export function membershipIsBoat(kind?: string | null): boolean {
  return kind !== YOUTH_LAND;
}

export function membershipIsYouthLand(kind?: string | null): boolean {
  return kind === YOUTH_LAND;
}

export function boatMemberships(
  memberships: TeamMembershipRef[],
): TeamMembershipRef[] {
  return memberships.filter((row) => membershipIsBoat(row.entryKind));
}

export function youthLandMemberships(
  memberships: TeamMembershipRef[],
): TeamMembershipRef[] {
  return memberships.filter((row) => membershipIsYouthLand(row.entryKind));
}

/** Join / ensure: youth never blocks a boat; a different boat does. */
export function decideTeamMembership(input: {
  existing: TeamMembershipRef[];
  target: TeamMembershipRef;
}): TeamMembershipDecision {
  const already = input.existing.some((row) => row.teamId === input.target.teamId);
  if (already) return { ok: true, already: true };

  if (membershipIsBoat(input.target.entryKind)) {
    const otherBoat = boatMemberships(input.existing).find(
      (row) => row.teamId !== input.target.teamId,
    );
    if (otherBoat) {
      return {
        ok: false,
        reason: "other-boat",
        error: ALREADY_ON_ANOTHER_BOAT,
      };
    }
  }

  return { ok: true, already: false };
}

export function pickDisplayTeamName(
  teams: Array<{ teamName: string; entryKind?: string | null }>,
): string | null {
  if (teams.length === 0) return null;
  const boat = teams.find((team) => membershipIsBoat(team.entryKind));
  return boat?.teamName ?? teams[0]?.teamName ?? null;
}

export function userOwnsTeam(input: {
  userId: string;
  userEmail?: string | null;
  claimedByUserId?: string | null;
  registrantEmail?: string | null;
}): boolean {
  if (input.claimedByUserId && input.claimedByUserId === input.userId) {
    return true;
  }
  const userEmail = input.userEmail?.trim().toLowerCase() ?? "";
  const registrant = input.registrantEmail?.trim().toLowerCase() ?? "";
  return Boolean(userEmail && registrant && userEmail === registrant);
}

export function uniqueTeamIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}
