import { amountDueCents, MAX_ANGLERS } from "./config.ts";

export type RebillTeamSnapshot = {
  id: string;
  teamName: string;
  amountDueCents: number;
  paymentStatus: string;
  sidePotCount: number;
  anglerCount: number;
};

export type RebillPlan = {
  id: string;
  teamName: string;
  anglerCount: number;
  sidePotCount: number;
  currentDueCents: number;
  nextDueCents: number;
  paymentStatus: string;
  reason: "under-four" | "align-formula";
};

/**
 * Recalc plan for stored `Team.amountDueCents`.
 * Does not change paymentStatus. Idempotent when already on the new formula.
 */
export function planBoatEntryRebill(
  teams: RebillTeamSnapshot[],
): RebillPlan[] {
  const plans: RebillPlan[] = [];
  for (const team of teams) {
    const nextDueCents = amountDueCents(team.sidePotCount);
    if (team.amountDueCents === nextDueCents) continue;
    plans.push({
      id: team.id,
      teamName: team.teamName,
      anglerCount: team.anglerCount,
      sidePotCount: team.sidePotCount,
      currentDueCents: team.amountDueCents,
      nextDueCents,
      paymentStatus: team.paymentStatus,
      reason: team.anglerCount < MAX_ANGLERS ? "under-four" : "align-formula",
    });
  }
  return plans;
}
