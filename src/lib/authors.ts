import { pickDisplayTeamName } from "./team-membership";

export function authorName(row: {
  user?: { name: string } | null;
  angler?: { fullName: string } | null;
}): string {
  return row.angler?.fullName ?? row.user?.name ?? "Guest";
}

export const userTeamNameSelect = {
  claimedTeams: { select: { teamName: true, entryKind: true } },
  memberships: {
    select: { team: { select: { teamName: true, entryKind: true } } },
  },
} as const;

export function authorTeamName(row: {
  user?: {
    claimedTeams?: Array<{ teamName: string; entryKind?: string | null }> | null;
    memberships?: Array<{
      team?: { teamName: string; entryKind?: string | null } | null;
    }> | null;
  } | null;
  angler?: { team?: { teamName: string } | null } | null;
}): string {
  const fromMemberships = (row.user?.memberships ?? [])
    .map((item) => item.team)
    .filter((team): team is { teamName: string; entryKind?: string | null } =>
      Boolean(team),
    );
  const fromClaims = row.user?.claimedTeams ?? [];
  return (
    pickDisplayTeamName([...fromMemberships, ...fromClaims]) ??
    row.angler?.team?.teamName ??
    ""
  );
}

export function commentAuthorName(row: {
  user?: { name: string } | null;
  angler?: { fullName: string } | null;
}): string {
  return row.user?.name ?? row.angler?.fullName ?? "Guest";
}
