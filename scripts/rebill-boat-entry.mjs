/**
 * Recalc Team.amountDueCents to $300 + $50 × sidePotCount.
 *
 * Rebill policy:
 * - Teams with fewer than 4 roster seats (including youth) are set to the
 *   new boat formula.
 * - Teams already at $300 + side pots (typical 4-adult boats) are skipped
 *   — recalc is idempotent.
 * - A 4-seat boat billed under old per-adult math (youth discount) is
 *   aligned to the same formula.
 * - paymentStatus is never changed.
 *
 * Usage (Neon/prod or local Docker):
 *   DATABASE_URL=... npm run rebill:boat-entry -- --dry-run
 *   DATABASE_URL=... npm run rebill:boat-entry
 *
 * On Vercel/Neon, run from a machine that can reach the database, using the
 * same DATABASE_URL as the Production env (pooled is fine for this update).
 */
import { PrismaClient } from "@prisma/client";
import { planBoatEntryRebill } from "../src/lib/rebill-boat-entry.ts";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

function formatUsd(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function main() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      teamName: true,
      amountDueCents: true,
      paymentStatus: true,
      sidePots: true,
      _count: { select: { anglers: true } },
    },
    orderBy: { teamName: "asc" },
  });

  const plans = planBoatEntryRebill(
    teams.map((team) => ({
      id: team.id,
      teamName: team.teamName,
      amountDueCents: team.amountDueCents,
      paymentStatus: team.paymentStatus,
      sidePotCount: team.sidePots.length,
      anglerCount: team._count.anglers,
    })),
  );

  if (plans.length === 0) {
    console.log(`No updates. ${teams.length} team(s) already match $300 + side pots.`);
    return;
  }

  console.log(
    `${dryRun ? "Would update" : "Updating"} ${plans.length} of ${teams.length} team(s):`,
  );
  for (const plan of plans) {
    console.log(
      `  ${plan.teamName} (${plan.anglerCount} anglers, ${plan.sidePotCount} pots, ${plan.reason}): ${formatUsd(plan.currentDueCents)} → ${formatUsd(plan.nextDueCents)} [${plan.paymentStatus}]`,
    );
  }

  if (dryRun) {
    console.log("Dry run — no rows written. Re-run without --dry-run to apply.");
    return;
  }

  for (const plan of plans) {
    await prisma.team.update({
      where: { id: plan.id },
      data: { amountDueCents: plan.nextDueCents },
    });
  }
  console.log(`Updated ${plans.length} team(s). paymentStatus left as-is.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
