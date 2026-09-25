import { PAID_SIDE_POTS } from "./config.ts";
import {
  blackjackDistanceUnder,
  blackjackLengthEligible,
  canEnterMainStringer,
  evaluateSidePot,
  formatWeightLbs,
  qualifyingStringerTotal,
  rankMainStringers,
  rankSidePot,
  type PaidPotId,
  type SlotFish,
} from "./weigh-scoring.ts";

export type BoardSession = {
  id: string;
  label: string;
  status: string;
  updatedAt: string;
  startsAt: string | null;
  endsAt: string | null;
};

export type BoardTeam = {
  id: string;
  teamName: string;
  entryKind: string | null;
  sidePots: string[];
};

export type BoardFish = {
  id: string;
  teamId: string;
  species: string;
  weightLbs: number;
  lengthInches: number | null;
  spotCount: number | null;
  weighedAt: string;
  sequence: number;
  disqualified: boolean;
  taggedTrout: boolean;
  dqReason?: string | null;
  notes?: string | null;
};

export type BoardStringer = {
  teamId: string;
  status: string;
  troutFishId: string | null;
  redfish: Array<{ slot: number; weighedFishId: string }>;
  totalWeightLbs: number;
  lockedAt: string | null;
  dqReason: string | null;
  unlockNote?: string | null;
};

export type WeighInRankRow = {
  rank: number;
  teamId: string;
  teamName: string;
  troutLbs: number | null;
  troutDq: boolean;
  redfishLbs: [number | null, number | null, number | null];
  redfishDq: [boolean, boolean, boolean];
  totalWeightLbs: number;
  lockedAt: string | null;
};

export type WeighInLeaderboard = {
  session: BoardSession | null;
  version: string;
  hero: {
    teamName: string;
    totalWeightLbs: number;
    deltaLbs: number | null;
  } | null;
  ranks: WeighInRankRow[];
  disqualified: Array<{ teamId: string; teamName: string; reason: string }>;
  onTheScale: string[];
  boatsRemaining: string[];
};

export type SidePotLeader = {
  place: number;
  teamId: string;
  teamName: string;
  metricLabel: string;
  weightLbs: number;
  lengthInches: number | null;
  spotCount: number | null;
  distanceUnder21: number | null;
  weighedAt: string;
};

export type SidePotColumn = {
  id: PaidPotId;
  name: string;
  poolCents: number;
  entrantCount: number;
  leaders: SidePotLeader[];
};

export type SidePotLeaderboard = {
  session: BoardSession | null;
  version: string;
  pots: SidePotColumn[];
};

export type SidePotEntryRef = {
  potId: string;
  teamId: string;
  weighedFishId: string;
};

export type PotPool = {
  id: string;
  totalCents: number;
  entrantCount: number;
};

function fishById(fish: BoardFish[]): Map<string, BoardFish> {
  return new Map(fish.map((row) => [row.id, row]));
}

function toSlot(fish: BoardFish | null | undefined): SlotFish | null {
  if (!fish) return null;
  return {
    id: fish.id,
    species: fish.species,
    weightLbs: fish.weightLbs,
    weighedAt: fish.weighedAt,
    sequence: fish.sequence,
    disqualified: fish.disqualified,
    taggedTrout: fish.taggedTrout,
  };
}

export function redfishSlots(
  stringer: BoardStringer,
  lookup: Map<string, BoardFish>,
): Array<BoardFish | null> {
  const slots: Array<BoardFish | null> = [null, null, null];
  for (const slot of stringer.redfish) {
    if (slot.slot < 1 || slot.slot > 3) continue;
    slots[slot.slot - 1] = lookup.get(slot.weighedFishId) ?? null;
  }
  return slots;
}

export function buildWeighInStandings(input: {
  session: BoardSession | null;
  teams: BoardTeam[];
  fish: BoardFish[];
  stringers: BoardStringer[];
}): Omit<WeighInLeaderboard, "version"> {
  const lookup = fishById(input.fish);
  const stringerByTeam = new Map(input.stringers.map((row) => [row.teamId, row]));
  const rankInputs = [];
  const disqualified: WeighInLeaderboard["disqualified"] = [];
  const displayByTeam = new Map<
    string,
    {
      troutLbs: number | null;
      troutDq: boolean;
      redfishLbs: [number | null, number | null, number | null];
      redfishDq: [boolean, boolean, boolean];
    }
  >();

  for (const team of input.teams) {
    if (!canEnterMainStringer(team.entryKind)) continue;
    const stringer = stringerByTeam.get(team.id);
    if (!stringer) continue;
    const trout = stringer.troutFishId ? lookup.get(stringer.troutFishId) ?? null : null;
    const reds = redfishSlots(stringer, lookup);
    const live = qualifyingStringerTotal({
      trout: toSlot(trout),
      redfish: reds.map((fish) => toSlot(fish)),
    });
    displayByTeam.set(team.id, {
      troutLbs: trout && !trout.disqualified ? trout.weightLbs : null,
      troutDq: Boolean(trout?.disqualified),
      redfishLbs: [
        reds[0] && !reds[0].disqualified ? reds[0].weightLbs : null,
        reds[1] && !reds[1].disqualified ? reds[1].weightLbs : null,
        reds[2] && !reds[2].disqualified ? reds[2].weightLbs : null,
      ],
      redfishDq: [
        Boolean(reds[0]?.disqualified),
        Boolean(reds[1]?.disqualified),
        Boolean(reds[2]?.disqualified),
      ],
    });

    if (stringer.status === "DQ" || (stringer.status === "LOCKED" && live.qualifyingCount === 0)) {
      const fishReason =
        trout?.dqReason ||
        reds.find((fish) => fish?.disqualified && fish.dqReason)?.dqReason ||
        null;
      disqualified.push({
        teamId: team.id,
        teamName: team.teamName,
        reason: stringer.dqReason?.trim() || fishReason?.trim() || "Disqualified",
      });
      continue;
    }

    rankInputs.push({
      teamId: team.id,
      teamName: team.teamName,
      entryKind: team.entryKind,
      status: stringer.status,
      totalWeightLbs: live.totalWeightLbs,
      lockedAt: stringer.lockedAt,
      firstWeighedAt: live.firstWeighedAt,
      firstSequence: live.firstSequence,
    });
  }

  const ranked = rankMainStringers(rankInputs);
  const ranks: WeighInRankRow[] = ranked.map((row) => {
    const display = displayByTeam.get(row.teamId);
    return {
      rank: row.rank,
      teamId: row.teamId,
      teamName: row.teamName,
      troutLbs: display?.troutLbs ?? null,
      troutDq: display?.troutDq ?? false,
      redfishLbs: display?.redfishLbs ?? [null, null, null],
      redfishDq: display?.redfishDq ?? [false, false, false],
      totalWeightLbs: row.totalWeightLbs,
      lockedAt: row.lockedAt,
    };
  });

  const rankedIds = new Set(ranks.map((row) => row.teamId));
  const dqIds = new Set(disqualified.map((row) => row.teamId));
  const onTheScale: string[] = [];
  const boatsRemaining: string[] = [];
  for (const team of input.teams) {
    if (!canEnterMainStringer(team.entryKind)) continue;
    if (rankedIds.has(team.id) || dqIds.has(team.id)) continue;
    const stringer = stringerByTeam.get(team.id);
    const hasFish =
      Boolean(stringer?.troutFishId) || (stringer?.redfish.length ?? 0) > 0;
    if (stringer?.status === "DRAFT" && hasFish) onTheScale.push(team.teamName);
    else boatsRemaining.push(team.teamName);
  }

  const leader = ranks[0];
  const second = ranks[1];
  const hero = leader
    ? {
        teamName: leader.teamName,
        totalWeightLbs: leader.totalWeightLbs,
        deltaLbs: second
          ? Math.round((leader.totalWeightLbs - second.totalWeightLbs) * 1000) / 1000
          : null,
      }
    : null;

  return {
    session: input.session,
    hero,
    ranks,
    disqualified,
    onTheScale,
    boatsRemaining,
  };
}

export function buildSidePotStandings(input: {
  session: BoardSession | null;
  teams: BoardTeam[];
  fish: BoardFish[];
  entries: SidePotEntryRef[];
  pools: PotPool[];
}): Omit<SidePotLeaderboard, "version"> {
  const teamsById = new Map(input.teams.map((team) => [team.id, team]));
  const lookup = fishById(input.fish);
  const pools = new Map(input.pools.map((pool) => [pool.id, pool]));

  const pots = PAID_SIDE_POTS.map((pot) => {
    const potId = pot.id as PaidPotId;
    const candidates = [];
    for (const entry of input.entries) {
      if (entry.potId !== potId) continue;
      const team = teamsById.get(entry.teamId);
      const fish = lookup.get(entry.weighedFishId);
      if (!team || !fish) continue;
      const evaluation = evaluateSidePot(potId, fish, team.sidePots);
      const distance =
        potId === "blackjack" &&
        fish.lengthInches != null &&
        blackjackLengthEligible(fish.lengthInches)
          ? blackjackDistanceUnder(fish.lengthInches)
          : null;
      candidates.push({
        teamId: team.id,
        teamName: team.teamName,
        eligible: evaluation.eligible,
        weightLbs: fish.weightLbs,
        lengthInches: fish.lengthInches,
        spotCount: fish.spotCount,
        weighedAt: fish.weighedAt,
        sequence: fish.sequence,
        metricLabel: evaluation.metricLabel,
        distanceUnder21: distance,
      });
    }
    const ranked = rankSidePot(potId, candidates);
    const labels = new Map(candidates.map((row) => [row.teamId, row]));
    const pool = pools.get(potId);
    return {
      id: potId,
      name: pot.name,
      poolCents: pool?.totalCents ?? 0,
      entrantCount: pool?.entrantCount ?? 0,
      leaders: ranked.slice(0, 10).map((row) => ({
        place: row.place,
        teamId: row.teamId,
        teamName: row.teamName,
        metricLabel: labels.get(row.teamId)?.metricLabel ?? formatWeightLbs(row.weightLbs),
        weightLbs: row.weightLbs,
        lengthInches: row.lengthInches,
        spotCount: row.spotCount,
        distanceUnder21: labels.get(row.teamId)?.distanceUnder21 ?? null,
        weighedAt: row.weighedAt,
      })),
    };
  });

  return { session: input.session, pots };
}

export function slotWeightText(lbs: number | null, dq: boolean): string {
  if (dq) return "DQ";
  if (lbs == null) return "—";
  return formatWeightLbs(lbs);
}

export type WeighAdminData = {
  sessions: BoardSession[];
  activeSessionId: string | null;
  teams: BoardTeam[];
  fish: BoardFish[];
  stringers: BoardStringer[];
  sidePotEntries: Array<{
    id: string;
    potId: string;
    teamId: string;
    weighedFishId: string;
    eligible: boolean;
    ineligibleReason: string | null;
    metricLabel: string;
  }>;
};
