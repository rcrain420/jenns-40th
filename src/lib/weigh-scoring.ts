/**
 * Official weigh-in scoring. Mirrors docs/tournament-rules.md §§10–11 and §16.
 * Pure functions — never reads FishCatch or invents a winner from a photo.
 */

export const WEIGH_SPECIES = ["TROUT", "REDFISH", "CATFISH"] as const;
export type WeighSpecies = (typeof WEIGH_SPECIES)[number];

export const PAID_POT_IDS = ["trout", "blackjack", "spots"] as const;
export type PaidPotId = (typeof PAID_POT_IDS)[number];

export const STRINGER_STATUS = ["DRAFT", "LOCKED", "DQ"] as const;
export type StringerStatus = (typeof STRINGER_STATUS)[number];

export const TROUT_MIN_INCHES = 15;
export const TROUT_MAX_INCHES = 20;
export const BLACKJACK_TARGET_INCHES = 21;
export const MAX_STRINGER_REDFISH = 3;

/** Public boards and the optional TV cast poll on this cadence while the session is OPEN. */
export const WEIGH_POLL_OPEN_MS = 2500;
/** Slower poll after the session is CLOSED. */
export const WEIGH_POLL_CLOSED_MS = 15_000;

const YOUTH_LAND = "YOUTH_LAND";

export function isWeighSpecies(value: string): value is WeighSpecies {
  return (WEIGH_SPECIES as readonly string[]).includes(value);
}

export function isPaidPotId(value: string): value is PaidPotId {
  return (PAID_POT_IDS as readonly string[]).includes(value);
}

/** Boat teams only. RowRide / YOUTH_LAND never posts the main stringer. */
export function canEnterMainStringer(entryKind: string | null | undefined): boolean {
  return entryKind !== YOUTH_LAND;
}

/** Eligibility is Team.sidePots. Payment status is not a second gate. */
export function teamBoughtSidePot(
  sidePots: readonly string[] | null | undefined,
  potId: string,
): boolean {
  return Boolean(sidePots?.includes(potId));
}

function milli(n: number): number {
  return Math.round(n * 1000);
}

export function sumWeights(weights: number[]): number {
  const total = weights.reduce((sum, weight) => sum + milli(weight), 0);
  return total / 1000;
}

export function formatWeightLbs(lbs: number | null | undefined): string {
  if (lbs == null || Number.isNaN(lbs)) return "—";
  return `${lbs.toFixed(2)} lb`;
}

export function formatInches(inches: number | null | undefined): string {
  if (inches == null || Number.isNaN(inches)) return "—";
  const rounded = milli(inches) / 1000;
  const text = rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${text} in`;
}

export function formatChicagoClock(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatChicagoTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function timeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Earlier official weigh time wins. Missing times sort last. */
export function compareWeighedFirst(
  a: { weighedAt: string | null; sequence?: number | null },
  b: { weighedAt: string | null; sequence?: number | null },
): number {
  const ta = timeMs(a.weighedAt);
  const tb = timeMs(b.weighedAt);
  if (ta == null && tb != null) return 1;
  if (tb == null && ta != null) return -1;
  if (ta != null && tb != null && ta !== tb) return ta - tb;
  const sa = a.sequence ?? Number.MAX_SAFE_INTEGER;
  const sb = b.sequence ?? Number.MAX_SAFE_INTEGER;
  return sa - sb;
}

export function troutLengthEligible(lengthInches: number | null | undefined): boolean {
  if (lengthInches == null || !Number.isFinite(lengthInches)) return false;
  const key = milli(lengthInches);
  return key >= milli(TROUT_MIN_INCHES) && key <= milli(TROUT_MAX_INCHES);
}

/** 21.0 inches is legal. Anything over 21 is not. */
export function blackjackLengthEligible(lengthInches: number | null | undefined): boolean {
  if (lengthInches == null || !Number.isFinite(lengthInches)) return false;
  return milli(lengthInches) <= milli(BLACKJACK_TARGET_INCHES);
}

export function blackjackDistanceUnder(lengthInches: number): number {
  return (milli(BLACKJACK_TARGET_INCHES) - milli(lengthInches)) / 1000;
}

export type SidePotFish = {
  species: string;
  weightLbs: number;
  lengthInches: number | null;
  spotCount: number | null;
  disqualified: boolean;
  taggedTrout?: boolean;
};

export type SidePotEvaluation = {
  eligible: boolean;
  reason: string | null;
  metricValue: number;
  metricLabel: string;
};

export function evaluateSidePot(
  potId: PaidPotId,
  fish: SidePotFish,
  teamSidePots: readonly string[],
): SidePotEvaluation {
  if (!teamBoughtSidePot(teamSidePots, potId)) {
    return {
      eligible: false,
      reason: "Team is not in this side pot",
      metricValue: 0,
      metricLabel: "Not entered",
    };
  }
  if (fish.disqualified) {
    return {
      eligible: false,
      reason: "Disqualified",
      metricValue: fish.weightLbs,
      metricLabel: "DQ",
    };
  }

  if (potId === "trout") {
    if (fish.species !== "TROUT") {
      return {
        eligible: false,
        reason: "Not a spotted seatrout",
        metricValue: fish.weightLbs,
        metricLabel: "Wrong species",
      };
    }
    if (fish.taggedTrout) {
      return {
        eligible: false,
        reason: "Tagged or bonus trout",
        metricValue: fish.weightLbs,
        metricLabel: "Tagged trout",
      };
    }
    if (!troutLengthEligible(fish.lengthInches)) {
      return {
        eligible: false,
        reason: "Trout must be 15–20 inches",
        metricValue: fish.weightLbs,
        metricLabel: fish.lengthInches == null ? "Length required" : formatInches(fish.lengthInches),
      };
    }
    return {
      eligible: true,
      reason: null,
      metricValue: fish.weightLbs,
      metricLabel: formatWeightLbs(fish.weightLbs),
    };
  }

  if (potId === "blackjack") {
    if (fish.species !== "REDFISH") {
      return {
        eligible: false,
        reason: "Not a redfish",
        metricValue: fish.lengthInches ?? 0,
        metricLabel: "Wrong species",
      };
    }
    if (fish.lengthInches == null) {
      return {
        eligible: false,
        reason: "Length required",
        metricValue: 0,
        metricLabel: "Length required",
      };
    }
    if (!blackjackLengthEligible(fish.lengthInches)) {
      return {
        eligible: false,
        reason: "Over 21 inches",
        metricValue: fish.lengthInches,
        metricLabel: formatInches(fish.lengthInches),
      };
    }
    const under = blackjackDistanceUnder(fish.lengthInches);
    return {
      eligible: true,
      reason: null,
      metricValue: fish.lengthInches,
      metricLabel: `${formatInches(fish.lengthInches)} · ${formatInches(under)} under 21`,
    };
  }

  if (fish.species !== "REDFISH") {
    return {
      eligible: false,
      reason: "Not a redfish",
      metricValue: fish.spotCount ?? 0,
      metricLabel: "Wrong species",
    };
  }
  if (fish.spotCount == null || !Number.isInteger(fish.spotCount) || fish.spotCount < 0) {
    return {
      eligible: false,
      reason: "Spot count required",
      metricValue: 0,
      metricLabel: "Spots required",
    };
  }
  const noun = fish.spotCount === 1 ? "spot" : "spots";
  return {
    eligible: true,
    reason: null,
    metricValue: fish.spotCount,
    metricLabel: `${fish.spotCount} ${noun}`,
  };
}

export type SlotFish = {
  id?: string;
  species: string;
  weightLbs: number;
  weighedAt: string;
  sequence: number;
  disqualified: boolean;
  taggedTrout?: boolean;
};

export type StringerScore = {
  totalWeightLbs: number;
  firstWeighedAt: string | null;
  firstSequence: number | null;
  qualifyingCount: number;
};

/** Sum of non-DQ fish already sitting in legal slots. Display / recompute path. */
export function qualifyingStringerTotal(input: {
  trout: SlotFish | null;
  redfish: Array<SlotFish | null>;
}): StringerScore {
  const qualifying: SlotFish[] = [];
  if (
    input.trout &&
    input.trout.species === "TROUT" &&
    !input.trout.disqualified &&
    !input.trout.taggedTrout
  ) {
    qualifying.push(input.trout);
  }
  for (const fish of input.redfish) {
    if (!fish || fish.disqualified || fish.species !== "REDFISH") continue;
    qualifying.push(fish);
  }
  return scoreQualifying(qualifying);
}

export function validateStringerAssignment(input: {
  trout: SlotFish | null;
  redfish: Array<SlotFish | null>;
  forLock?: boolean;
}): { ok: true; score: StringerScore } | { ok: false; error: string } {
  if (input.redfish.length > MAX_STRINGER_REDFISH) {
    return { ok: false, error: "A stringer can hold at most 3 redfish" };
  }
  const seen = new Set<string>();
  const qualifying: SlotFish[] = [];

  const claim = (fish: SlotFish): string | null => {
    if (!fish.id) return null;
    if (seen.has(fish.id)) return "That fish is already on the stringer";
    seen.add(fish.id);
    return null;
  };

  if (input.trout) {
    if (input.trout.species !== "TROUT") {
      return { ok: false, error: "The trout slot needs a spotted seatrout" };
    }
    if (input.trout.taggedTrout) {
      return {
        ok: false,
        error: "Tagged or bonus trout cannot be on the main stringer",
      };
    }
    if (input.trout.disqualified) {
      return { ok: false, error: "Disqualified fish cannot be on the stringer" };
    }
    const dup = claim(input.trout);
    if (dup) return { ok: false, error: dup };
    qualifying.push(input.trout);
  }

  let redfishCount = 0;
  for (const fish of input.redfish) {
    if (!fish) continue;
    redfishCount += 1;
    if (fish.species !== "REDFISH") {
      return { ok: false, error: "Redfish slots need redfish" };
    }
    if (fish.disqualified) {
      return { ok: false, error: "Disqualified fish cannot be on the stringer" };
    }
    const dup = claim(fish);
    if (dup) return { ok: false, error: dup };
    qualifying.push(fish);
  }

  if (redfishCount > MAX_STRINGER_REDFISH) {
    return { ok: false, error: "A stringer can hold at most 3 redfish" };
  }
  if (input.forLock && qualifying.length === 0) {
    return { ok: false, error: "Add at least one qualifying fish before locking" };
  }

  return { ok: true, score: scoreQualifying(qualifying) };
}

function scoreQualifying(fish: SlotFish[]): StringerScore {
  let firstWeighedAt: string | null = null;
  let firstSequence: number | null = null;
  let bestMs = Infinity;
  for (const row of fish) {
    const ms = timeMs(row.weighedAt);
    if (ms == null) continue;
    if (
      ms < bestMs ||
      (ms === bestMs && (firstSequence == null || row.sequence < firstSequence))
    ) {
      bestMs = ms;
      firstWeighedAt = row.weighedAt;
      firstSequence = row.sequence;
    }
  }
  return {
    totalWeightLbs: sumWeights(fish.map((row) => row.weightLbs)),
    firstWeighedAt,
    firstSequence,
    qualifyingCount: fish.length,
  };
}

export type StringerRankInput = {
  teamId: string;
  teamName: string;
  entryKind: string | null;
  status: string;
  totalWeightLbs: number;
  lockedAt: string | null;
  firstWeighedAt: string | null;
  firstSequence: number | null;
};

export type RankedStringer = StringerRankInput & { rank: number };

/**
 * Heaviest total wins. Tie → first qualifying fish weighed.
 * Drafts, DQ stringers, and youth entries are omitted.
 */
export function rankMainStringers(rows: StringerRankInput[]): RankedStringer[] {
  const lockedBoats = rows.filter(
    (row) => canEnterMainStringer(row.entryKind) && row.status === "LOCKED",
  );
  const sorted = [...lockedBoats].sort((a, b) => {
    const weight = milli(b.totalWeightLbs) - milli(a.totalWeightLbs);
    if (weight !== 0) return weight;
    const weighed = compareWeighedFirst(
      { weighedAt: a.firstWeighedAt, sequence: a.firstSequence },
      { weighedAt: b.firstWeighedAt, sequence: b.firstSequence },
    );
    if (weighed !== 0) return weighed;
    const locked = compareWeighedFirst(
      { weighedAt: a.lockedAt, sequence: null },
      { weighedAt: b.lockedAt, sequence: null },
    );
    if (locked !== 0) return locked;
    return a.teamId.localeCompare(b.teamId);
  });
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export type SidePotCandidate = {
  teamId: string;
  teamName: string;
  eligible: boolean;
  weightLbs: number;
  lengthInches: number | null;
  spotCount: number | null;
  weighedAt: string;
  sequence: number;
};

export type RankedSidePot = SidePotCandidate & { place: number };

export function rankSidePot(
  potId: PaidPotId,
  entries: SidePotCandidate[],
): RankedSidePot[] {
  const eligible = entries.filter((entry) => entry.eligible);
  const sorted = [...eligible].sort((a, b) => compareSidePot(potId, a, b));
  return sorted.map((row, index) => ({ ...row, place: index + 1 }));
}

function compareSidePot(potId: PaidPotId, a: SidePotCandidate, b: SidePotCandidate): number {
  if (potId === "trout") {
    const weight = milli(b.weightLbs) - milli(a.weightLbs);
    if (weight !== 0) return weight;
  } else if (potId === "blackjack") {
    const length = milli(b.lengthInches ?? -1) - milli(a.lengthInches ?? -1);
    if (length !== 0) return length;
    const weight = milli(b.weightLbs) - milli(a.weightLbs);
    if (weight !== 0) return weight;
  } else {
    const spots = (b.spotCount ?? -1) - (a.spotCount ?? -1);
    if (spots !== 0) return spots;
    const weight = milli(b.weightLbs) - milli(a.weightLbs);
    if (weight !== 0) return weight;
  }
  const weighed = compareWeighedFirst(a, b);
  if (weighed !== 0) return weighed;
  return a.teamId.localeCompare(b.teamId);
}

export function announceBoardPlace(
  rank: number | null,
  totalWeightLbs: number,
  locked: boolean,
): string {
  const total = formatWeightLbs(totalWeightLbs);
  if (!locked || rank == null) {
    return `Saved — ${total}. Lock the stringer to post it.`;
  }
  return `#${rank} on the board — ${total}`;
}
