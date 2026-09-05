import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminTeamEditor } from "@/components/AdminTeamEditor";
import { getCurrentUser } from "@/lib/auth";
import type { SidePotId } from "@/lib/config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminTeamDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/login?next=/admin");

  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
  });

  if (!team) notFound();

  return (
    <main className="flex-1 bg-salt px-5 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin" className="text-sm text-sea hover:underline">
          ← All teams
        </Link>
        <h1 className="mt-4 font-display text-3xl text-wave">
          Edit {team.teamName}
        </h1>
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <AdminTeamEditor
            mode="edit"
            teamId={team.id}
            initial={{
              teamName: team.teamName,
              boatType: team.boatType as "GUIDED" | "NON_GUIDED",
              captainName: team.captainName ?? "",
              captainPhone: team.captainPhone ?? "",
              captainEmail: team.captainEmail ?? "",
              contactName: team.contactName ?? "",
              contactPhone: team.contactPhone ?? "",
              contactEmail: team.contactEmail ?? "",
              registrantEmail: team.registrantEmail,
              notes: team.notes ?? "",
              licenseConfirmed: team.licenseConfirmed,
              paymentStatus: team.paymentStatus as "UNPAID" | "PAID",
              anglers: team.anglers.map((a) => ({
                fullName: a.fullName,
                phone: a.phone ?? "",
                email: a.email ?? "",
                isYouth: a.isYouth,
                shirtSize: a.shirtSize ?? "",
              })),
              sidePots: team.sidePots as SidePotId[],
            }}
          />
        </div>
      </div>
    </main>
  );
}
