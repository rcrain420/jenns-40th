/**
 * Adult boat seats vs land-only RowRide youth.
 * Leaf module so Node tests can import it without extension rewriting.
 * Numbers match config.MIN/MAX_ANGLERS and MAX_YOUTH_ANGLERS.
 *
 * Enforced app cap: 1–4 adults on a BOAT team. New writes are
 * adults-only — youth register on a YOUTH_LAND entry. Leftover
 * youth rows on a boat still do not consume an adult seat.
 * Land-only RowRide allows 1–8 youth.
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

/** Named people on a roster — adults and youth. Not the adult cap. */
export function namedSeatCount(
  anglers: Array<{ isYouth?: boolean | null }>,
): number {
  return anglers.length;
}

export const BOAT_ADULT_MIN_ERROR = `Boat teams need at least ${MIN_ADULTS} adult angler. Kids do not fill that seat — they register separately for RowRide from land.`;

export const BOAT_ADULT_MAX_ERROR = `At most ${MAX_ADULTS} adult anglers on a boat. Kids do not count toward that cap.`;

export const BOAT_YOUTH_FORBIDDEN_ERROR =
  "Boat teams are adults only. Register kids separately for RowRide from land.";

export const YOUTH_MAX_ERROR = `At most ${MAX_YOUTH} youth anglers on one entry.`;

export const LAND_YOUTH_ONLY_ERROR =
  "Land-only RowRide entries are youth only. Register a boat if adults are fishing the main tournament.";

export const LAND_YOUTH_MIN_ERROR = `Add at least ${MIN_YOUTH} youth angler for a land-only RowRide entry.`;

/** Adult 1–4 math. Leftover youth rows on a boat do not fail this check. */
export function boatRosterCapacityIssue(
  anglers: Array<{ isYouth?: boolean | null }>,
): string | null {
  const adults = adultSeatCount(anglers);
  if (adults < MIN_ADULTS) return BOAT_ADULT_MIN_ERROR;
  if (adults > MAX_ADULTS) return BOAT_ADULT_MAX_ERROR;
  if (youthSeatCount(anglers) > MAX_YOUTH) return YOUTH_MAX_ERROR;
  return null;
}

/** New BOAT writes: reject any isYouth: true row. */
export function boatYouthForbiddenIssue(
  anglers: Array<{ isYouth?: boolean | null }>,
): string | null {
  if (youthSeatCount(anglers) > 0) return BOAT_YOUTH_FORBIDDEN_ERROR;
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
  entryKind: string = "BOAT",
): boolean {
  if (entryKind !== "YOUTH_LAND") return false;
  return youthSeatCount(anglers) < MAX_YOUTH;
}
