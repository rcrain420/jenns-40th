/**
 * Official roster is paid fishing names nested under each boat.
 * No emails, PINs, or unpaid flags — those stay off this list.
 * Leaf module so Node tests can import it without extension rewriting.
 */

export type OfficialRosterAngler = {
  name: string;
  isYouth?: boolean;
  statusLabel?: string | null;
  isAnglerSeat?: boolean;
};

export type OfficialRosterBoat = {
  id: string;
  boatName: string;
  isOwn?: boolean;
  /** BOAT (default) or YOUTH_LAND */
  entryKind?: string;
  anglers: OfficialRosterAngler[];
};

export function isOfficialRosterSeat(row: OfficialRosterAngler): boolean {
  return row.isAnglerSeat !== false;
}

export function officialRosterAnglerLine(row: OfficialRosterAngler): string {
  if (row.statusLabel) return `${row.name} · ${row.statusLabel}`;
  if (row.isYouth) return `${row.name} · youth`;
  return row.name;
}

/** Per-seat pot contribution is always $0 — entry is a flat boat fee. */
export function officialRosterPotCents(row: OfficialRosterAngler): number {
  void row;
  return 0;
}

export function officialRosterPotAmountLabel(row: OfficialRosterAngler): string {
  if (!isOfficialRosterSeat(row)) return "—";
  if (row.isYouth) return "included · youth";
  return "included";
}

/** Main-pot cents this boat adds: $300 if it has an adult fishing seat. */
export function officialRosterBoatPotCents(
  rows: OfficialRosterAngler[],
  boatEntryCents: number,
  entryKind?: string | null,
): number {
  if (entryKind === "YOUTH_LAND") return 0;
  return officialRosterAdultSeatCount(rows) > 0 ? boatEntryCents : 0;
}

export function officialRosterLandSummary(): string {
  return "RowRide · land · no boat fee";
}

export function officialRosterAdultSeatCount(
  rows: OfficialRosterAngler[],
): number {
  return rows.filter((row) => isOfficialRosterSeat(row) && !row.isYouth).length;
}

export function officialRosterPotSummary(opts: {
  boatCount: number;
  potCents: number;
  format: (cents: number) => string;
}): string {
  const noun = opts.boatCount === 1 ? "boat" : "boats";
  return `${opts.boatCount} ${noun} · pot ${opts.format(opts.potCents)}`;
}

export function alsoOnThisBoatLine(names: string[]): string | null {
  if (names.length === 0) return null;
  const noun = names.length === 1 ? "an angler seat" : "angler seats";
  return `Also on this boat: ${names.join(", ")} (not ${noun})`;
}

export function groupOfficialRosterByBoat(
  teams: Array<{
    id: string;
    teamName: string;
    isOwn?: boolean;
    entryKind?: string | null;
    anglers: Array<{
      fullName: string;
      isYouth?: boolean | null;
      statusLabel?: string | null;
      isAnglerSeat?: boolean | null;
    }>;
  }>,
): OfficialRosterBoat[] {
  return teams.map((team) => ({
    id: team.id,
    boatName: team.teamName,
    isOwn: team.isOwn === true,
    entryKind: team.entryKind ?? "BOAT",
    anglers: team.anglers.map((angler) => ({
      name: angler.fullName,
      isYouth: angler.isYouth === true,
      statusLabel: angler.statusLabel ?? null,
      isAnglerSeat: angler.isAnglerSeat !== false,
    })),
  }));
}
