import { redirect } from "next/navigation";
import { AdminDashboard, type AdminTeamRow } from "@/components/AdminDashboard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminPaymentStats } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/login?next=/admin");
  }

  const teams = await prisma.team.findMany({
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const anglerCount = teams.reduce((sum, t) => sum + t.anglers.length, 0);
  // Collected = sum of amountPaidCents (actual ledger, including overpay).
  // Outstanding = sum of max(0, due − paid).
  const { collectedCents, outstandingCents } = adminPaymentStats(teams);

  const rows: AdminTeamRow[] = teams.map((t) => ({
    id: t.id,
    teamName: t.teamName,
    boatType: t.boatType,
    entryKind: t.entryKind,
    paymentStatus: t.paymentStatus,
    amountDueCents: t.amountDueCents,
    amountPaidCents: t.amountPaidCents,
    registrantEmail: t.registrantEmail,
    captainName: t.captainName,
    contactName: t.contactName,
    anglers: t.anglers.map((a) => ({
      fullName: a.fullName,
      email: a.email,
      isYouth: a.isYouth,
      shirtSize: a.shirtSize,
    })),
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <main className="flex-1 bg-salt px-5 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminDashboard
          teams={rows}
          stats={{
            teamCount: teams.length,
            anglerCount,
            collectedCents,
            outstandingCents,
          }}
        />
      </div>
    </main>
  );
}
