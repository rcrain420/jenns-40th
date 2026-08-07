import {
  FEE_PER_ANGLER_CENTS,
  MAIN_POT_SPLITS,
  PAID_SIDE_POTS,
  SIDE_POT_BUY_IN_CENTS,
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
  mainPotCents: number;
  payouts: PotPayout[];
  sidePots: SidePotTotal[];
};

export async function getPotTotals(): Promise<PotTotals> {
  const teams = await prisma.team.findMany({
    select: {
      sidePots: true,
      _count: { select: { anglers: true } },
    },
  });

  const teamCount = teams.length;
  const anglerCount = teams.reduce((sum, t) => sum + t._count.anglers, 0);
  const mainPotCents = anglerCount * FEE_PER_ANGLER_CENTS;

  const payouts = MAIN_POT_SPLITS.map((split) => ({
    place: split.place,
    pct: split.pct,
    amountCents: Math.round((mainPotCents * split.pct) / 100),
  }));

  const sidePots = PAID_SIDE_POTS.map((pot) => {
    const entrantCount = teams.filter((t) =>
      t.sidePots.includes(pot.id),
    ).length;
    return {
      id: pot.id,
      name: pot.name,
      entrantCount,
      totalCents: entrantCount * SIDE_POT_BUY_IN_CENTS,
    };
  });

  return { teamCount, anglerCount, mainPotCents, payouts, sidePots };
}
