import { isBoatEntry, isYouthLandEntry } from "./config.ts";
import { adminPaymentStats } from "./payments.ts";

export type AdminConsoleTeam = {
  entryKind?: string | null;
  boatType?: string | null;
  amountDueCents: number;
  amountPaidCents: number;
  anglers: Array<{ isYouth?: boolean | null }>;
};

export type AdminConsoleStats = {
  boatCount: number;
  adultAnglerCount: number;
  /** Youth rows still stored on a BOAT team. They are not adult seats. */
  youthOnBoats: number;
  collectedCents: number;
  outstandingCents: number;
  rowRideCount: number;
  rowRideAnglerCount: number;
  rowRideCollectedCents: number;
  rowRideOutstandingCents: number;
  /** True when any RowRide entry has a side-pot balance or a recorded payment. */
  rowRideHasSidePotMoney: boolean;
};

/**
 * Adult tournament totals vs RowRide.
 * Collected / outstanding on the adult side are boat payments only.
 * Free YOUTH_LAND rows ($0 due, $0 paid) do not move those numbers.
 * RowRide side-pot due/paid is reported separately.
 */
export function adminConsoleStats(teams: AdminConsoleTeam[]): AdminConsoleStats {
  const boats = teams.filter((team) => isBoatEntry(team.entryKind));
  const rowRide = teams.filter((team) => isYouthLandEntry(team.entryKind));
  const adultMoney = adminPaymentStats(boats);
  const rowRideMoney = adminPaymentStats(rowRide);

  let adultAnglerCount = 0;
  let youthOnBoats = 0;
  for (const team of boats) {
    for (const angler of team.anglers) {
      if (angler.isYouth) youthOnBoats += 1;
      else adultAnglerCount += 1;
    }
  }

  return {
    boatCount: boats.length,
    adultAnglerCount,
    youthOnBoats,
    collectedCents: adultMoney.collectedCents,
    outstandingCents: adultMoney.outstandingCents,
    rowRideCount: rowRide.length,
    rowRideAnglerCount: rowRide.reduce(
      (sum, team) => sum + team.anglers.length,
      0,
    ),
    rowRideCollectedCents: rowRideMoney.collectedCents,
    rowRideOutstandingCents: rowRideMoney.outstandingCents,
    rowRideHasSidePotMoney: rowRide.some(
      (team) => team.amountDueCents > 0 || team.amountPaidCents > 0,
    ),
  };
}

/**
 * Admin list filter. Guided / Non-guided are adult boats only —
 * YOUTH_LAND rows are stored as NON_GUIDED and must not match that filter.
 */
export function teamMatchesAdminEntryFilter(
  team: { entryKind?: string | null; boatType?: string | null },
  entryFilter: string,
): boolean {
  const rowRide = isYouthLandEntry(team.entryKind);
  if (entryFilter === "YOUTH_LAND") return rowRide;
  if (entryFilter === "GUIDED" || entryFilter === "NON_GUIDED") {
    return !rowRide && team.boatType === entryFilter;
  }
  return true;
}

/** Adult boats first, then RowRide. Relative order inside each group stays put. */
export function orderTeamsForExport<T extends { entryKind?: string | null }>(
  teams: T[],
): T[] {
  const boats: T[] = [];
  const rowRide: T[] = [];
  for (const team of teams) {
    if (isYouthLandEntry(team.entryKind)) rowRide.push(team);
    else boats.push(team);
  }
  return [...boats, ...rowRide];
}

export function adminDivisionLabel(entryKind?: string | null): "Adult" | "RowRide" {
  return isYouthLandEntry(entryKind) ? "RowRide" : "Adult";
}
