export function authorName(row: {
  user?: { name: string } | null;
  angler?: { fullName: string } | null;
}): string {
  return row.user?.name ?? row.angler?.fullName ?? "Guest";
}

export function authorTeamName(row: {
  user?: { claimedTeam?: { teamName: string } | null } | null;
  angler?: { team?: { teamName: string } | null } | null;
}): string {
  return row.user?.claimedTeam?.teamName ?? row.angler?.team?.teamName ?? "";
}

export function commentAuthorName(row: {
  user?: { name: string } | null;
  angler?: { fullName: string } | null;
}): string {
  return row.user?.name ?? row.angler?.fullName ?? "Guest";
}
