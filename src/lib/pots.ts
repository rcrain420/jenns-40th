import {
  MAIN_POT_SPLITS,
  PAID_SIDE_POTS,
  SIDE_POT_BUY_IN_CENTS,
  countRegisteredYouthAnglers,
  countSidePotEntrants,
  isBoatEntry,
  mainPotCentsForTeams,
  type SidePotId,
} from "./config";
import { prisma } from "./db";

export type PotPayout = {
  place: string;
  pct: number;
  amountCents: number;
};

export type SidePotTotal = {
  id: SidePotId;
  name: string;
  entrantCount: number;
  totalCents: number;
};

export type PotTotals = {
  teamCount: number;
  anglerCount: number;
  /** Named youth anglers (kids), not RowRide teams or adult boat seats. */
  youthAnglerCount: number;
  mainPotCents: number;
  payouts: PotPayout[];
  sidePots: SidePotTotal[];
};

export async function getPotTotals(): Promise<PotTotals> {
  const teams = await prisma.team.findMany({
    select: {
      entryKind: true,
      sidePots: true,
      anglers: { select: { isYouth: true } },
    },
  });

  const boatTeams = teams.filter((team) => isBoatEntry(team.entryKind));
  const teamCount = boatTeams.length;
  const anglerCount = boatTeams.reduce(
    (sum, t) => sum + t.anglers.filter((a) => a.isYouth !== true).length,
    0,
  );
  const youthAnglerCount = countRegisteredYouthAnglers(teams);
  const mainPotCents = mainPotCentsForTeams(teamCount);

  const payouts = MAIN_POT_SPLITS.map((split) => ({
    place: split.place,
    pct: split.pct,
    amountCents: Math.round((mainPotCents * split.pct) / 100),
  }));

  const sidePots = PAID_SIDE_POTS.map((pot) => {
    const entrantCount = countSidePotEntrants(teams, pot.id);
    return {
      id: pot.id,
      name: pot.name,
      entrantCount,
      totalCents: entrantCount * SIDE_POT_BUY_IN_CENTS,
    };
  });

  return {
    teamCount,
    anglerCount,
    youthAnglerCount,
    mainPotCents,
    payouts,
    sidePots,
  };
}
