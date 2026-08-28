export function authorName(row: {
  user?: { name: string } | null;
  angler?: { fullName: string } | null;
}): string {
  return row.angler?.fullName ?? row.user?.name ?? "Guest";
}

export const userTeamNameSelect = {
  claimedTeam: { select: { teamName: true } },
  membership: { select: { team: { select: { teamName: true } } } },
} as const;

export function authorTeamName(row: {
  user?: {
    claimedTeam?: { teamName: string } | null;
    membership?: { team?: { teamName: string } | null } | null;
  } | null;
  angler?: { team?: { teamName: string } | null } | null;
}): string {
  return (
    row.user?.membership?.team?.teamName ??
    row.user?.claimedTeam?.teamName ??
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
