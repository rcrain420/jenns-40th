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

/** Main-pot cents for this row. Boat-only accounts and youth are $0. */
export function officialRosterPotCents(
  row: OfficialRosterAngler,
  feeCents: number,
): number {
  if (!isOfficialRosterSeat(row) || row.isYouth) return 0;
  return feeCents;
}

export function officialRosterPotAmountLabel(
  row: OfficialRosterAngler,
  feeCents: number,
  format: (cents: number) => string,
): string {
  if (!isOfficialRosterSeat(row)) return "—";
  const cents = officialRosterPotCents(row, feeCents);
  if (row.isYouth) return `${format(cents)} · youth`;
  return format(cents);
}

export function officialRosterAdultSeatCount(
  rows: OfficialRosterAngler[],
): number {
  return rows.filter((row) => isOfficialRosterSeat(row) && !row.isYouth).length;
}

export function officialRosterPotSummary(opts: {
  adultAnglerCount: number;
  potCents: number;
  format: (cents: number) => string;
}): string {
  const seats =
    opts.adultAnglerCount === 1 ? "adult angler" : "adult anglers";
  return `${opts.adultAnglerCount} ${seats} · pot ${opts.format(opts.potCents)}`;
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
    anglers: team.anglers.map((angler) => ({
      name: angler.fullName,
      isYouth: angler.isYouth === true,
      statusLabel: angler.statusLabel ?? null,
      isAnglerSeat: angler.isAnglerSeat !== false,
    })),
  }));
}
