/**
 * Official roster is paid fishing names nested under each boat.
 * No emails, PINs, or unpaid flags — those stay off this list.
 * Leaf module so Node tests can import it without extension rewriting.
 */

export type OfficialRosterAngler = {
  name: string;
  isYouth?: boolean;
  statusLabel?: string | null;
};

export type OfficialRosterBoat = {
  id: string;
  boatName: string;
  isOwn?: boolean;
  anglers: OfficialRosterAngler[];
};

export function officialRosterAnglerLine(row: OfficialRosterAngler): string {
  if (row.statusLabel) return `${row.name} · ${row.statusLabel}`;
  if (row.isYouth) return `${row.name} · youth`;
  return row.name;
}

export function groupOfficialRosterByBoat(
  teams: Array<{
    id: string;
    teamName: string;
    isOwn?: boolean;
    anglers: Array<{
      fullName: string;
      isYouth?: boolean | null;
      statusLabel?: string | null;
    }>;
  }>,
): OfficialRosterBoat[] {
  return teams.map((team) => ({
    id: team.id,
    boatName: team.teamName,
    isOwn: team.isOwn === true,
    anglers: team.anglers.map((angler) => ({
      name: angler.fullName,
      isYouth: angler.isYouth === true,
      statusLabel: angler.statusLabel ?? null,
    })),
  }));
}
