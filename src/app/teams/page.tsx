import type { Metadata } from "next";
import Link from "next/link";
import { OfficialRosterByBoat } from "@/components/OfficialRosterByBoat";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { BOAT_ENTRY_CENTS, EVENT, isBoatEntry, isYouthLandEntry } from "@/lib/config";
import { prisma } from "@/lib/db";
import { toDirectoryTeam } from "@/lib/join-the-boat";
import { formatUsdWhole } from "@/lib/money";
import {
  groupOfficialRosterByBoat,
  officialRosterPotSummary,
} from "@/lib/official-roster";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Teams · ${EVENT.shortName}`,
  description:
    "Official fishing roster grouped by boat. Main pot is boats × $300.",
};

export default async function TeamsDirectoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <PageShell
        narrow
        title="Teams"
        description="Sign in to see the registered boats and who’s fishing."
      >
        <p className="text-ink/70">
          <Link href="/login?next=/teams" className="font-semibold text-sea hover:underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link
            href="/login?mode=signup&next=/teams"
            className="font-semibold text-sea hover:underline"
          >
            create an account
          </Link>{" "}
          to see the official roster grouped by boat.
        </p>
      </PageShell>
    );
  }

  const member = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    select: { teamId: true },
  });
  const ownTeamId = member?.teamId ?? null;

  const teams = await prisma.team.findMany({
    orderBy: { teamName: "asc" },
    select: {
      id: true,
      teamName: true,
      entryKind: true,
      captainName: true,
      captainEmail: true,
      anglers: {
        orderBy: { sortOrder: "asc" },
        select: { fullName: true, email: true, isYouth: true },
      },
      members: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const directory = teams.map((team) =>
    toDirectoryTeam({
      id: team.id,
      teamName: team.teamName,
      entryKind: team.entryKind,
      ownTeamId,
      anglers: team.anglers,
      members: team.members.map((m) => ({
        name: m.user.name,
        email: m.user.email,
      })),
      captain: {
        name: team.captainName,
        email: team.captainEmail,
      },
    }),
  );
  const boatDirectory = directory.filter((team) => isBoatEntry(team.entryKind));
  const landDirectory = directory.filter((team) =>
    isYouthLandEntry(team.entryKind),
  );
  const otherCount = boatDirectory.filter((team) => !team.isOwn).length;

  const boats = groupOfficialRosterByBoat(
    boatDirectory.map((team) => ({
      id: team.id,
      teamName: team.teamName,
      isOwn: team.isOwn,
      entryKind: team.entryKind,
      anglers: team.anglers.map((row) => ({
        fullName: row.name,
        isYouth: row.isYouth,
        statusLabel: row.statusLabel,
        isAnglerSeat: row.isAnglerSeat,
      })),
    })),
  );
  const landEntries = groupOfficialRosterByBoat(
    landDirectory.map((team) => ({
      id: team.id,
      teamName: team.teamName,
      isOwn: team.isOwn,
      entryKind: team.entryKind,
      anglers: team.anglers.map((row) => ({
        fullName: row.name,
        isYouth: row.isYouth,
        statusLabel: row.statusLabel,
        isAnglerSeat: row.isAnglerSeat,
      })),
    })),
  );
  const pageSummary =
    boatDirectory.length === 0
      ? null
      : officialRosterPotSummary({
          boatCount: boatDirectory.length,
          potCents: boatDirectory.length * BOAT_ENTRY_CENTS,
          format: formatUsdWhole,
        });

  return (
    <PageShell
      title="Teams"
      description="Official fishing roster — each boat grows the main pot by $300. A boat lists up to 4 anglers including kids. Youth do not compete in the main stringer. Land-only RowRide entries are listed separately. Boat accounts who joined but are not fishing are not seats."
    >
      <div className="space-y-6">
        {boatDirectory.length === 0 ? null : otherCount === 0 ? (
          <p className="text-ink/70">No other boats have registered yet.</p>
        ) : (
          <p className="text-ink/65">
            {boatDirectory.length}{" "}
            {boatDirectory.length === 1 ? "boat" : "boats"} on the list
            {pageSummary ? ` · ${pageSummary}` : ""}.
          </p>
        )}
        <OfficialRosterByBoat
          boats={boats}
          emptyListLabel="No boats have registered yet."
        />
        {landEntries.length > 0 ? (
          <OfficialRosterByBoat
            boats={landEntries}
            banner="RowRide land entries"
            emptyListLabel="No land-only RowRide entries yet."
          />
        ) : null}
      </div>
    </PageShell>
  );
}
