/**
 * Adult boat seats vs youth (RowRide) seats.
 * Leaf module so Node tests can import it without extension rewriting.
 * Numbers match config.MIN/MAX_ANGLERS and MAX_YOUTH_ANGLERS.
 */
const MIN_ADULTS = 1;
const MAX_ADULTS = 4;
const MIN_YOUTH = 1;
const MAX_YOUTH = 8;

export function adultSeatCount(
  anglers: Array<{ isYouth?: boolean | null }>,
): number {
  return anglers.filter((angler) => angler.isYouth !== true).length;
}

export function youthSeatCount(
  anglers: Array<{ isYouth?: boolean | null }>,
): number {
  return anglers.filter((angler) => angler.isYouth === true).length;
}

export const BOAT_ADULT_MIN_ERROR = `Boat teams need at least ${MIN_ADULTS} adult angler. Kids do not fill that seat — they may enter RowRide from land.`;

export const BOAT_ADULT_MAX_ERROR = `At most ${MAX_ADULTS} adult anglers on a boat. Youth tag-alongs do not count toward that cap.`;

export const YOUTH_MAX_ERROR = `At most ${MAX_YOUTH} youth anglers on one entry.`;

export const LAND_YOUTH_ONLY_ERROR =
  "Land-only RowRide entries are youth only. Register a boat if adults are fishing the main tournament.";

export const LAND_YOUTH_MIN_ERROR = `Add at least ${MIN_YOUTH} youth angler for a land-only RowRide entry.`;

export function boatRosterCapacityIssue(
  anglers: Array<{ isYouth?: boolean | null }>,
): string | null {
  const adults = adultSeatCount(anglers);
  if (adults < MIN_ADULTS) return BOAT_ADULT_MIN_ERROR;
  if (adults > MAX_ADULTS) return BOAT_ADULT_MAX_ERROR;
  if (youthSeatCount(anglers) > MAX_YOUTH) return YOUTH_MAX_ERROR;
  return null;
}

export function youthLandRosterCapacityIssue(
  anglers: Array<{ isYouth?: boolean | null }>,
): string | null {
  if (anglers.some((angler) => angler.isYouth !== true)) {
    return LAND_YOUTH_ONLY_ERROR;
  }
  if (anglers.length < MIN_YOUTH) return LAND_YOUTH_MIN_ERROR;
  if (anglers.length > MAX_YOUTH) return YOUTH_MAX_ERROR;
  return null;
}

export function canAddAdultSeat(
  anglers: Array<{ isYouth?: boolean | null }>,
): boolean {
  return adultSeatCount(anglers) < MAX_ADULTS;
}

export function canAddYouthSeat(
  anglers: Array<{ isYouth?: boolean | null }>,
): boolean {
  return youthSeatCount(anglers) < MAX_YOUTH;
}
