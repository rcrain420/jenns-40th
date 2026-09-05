import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { EVENT } from "@/lib/config";
import { prisma } from "@/lib/db";
import { toDirectoryTeam } from "@/lib/teams-directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Teams · ${EVENT.shortName}`,
  description: "Registered boats and the names on each roster.",
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
          to see the roster of boats.
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
      ownTeamId,
      anglers: team.anglers,
      members: team.members.map((m) => ({
        name: m.user.name,
        email: m.user.email,
      })),
    }),
  );
  const otherCount = directory.filter((team) => !team.isOwn).length;

  return (
    <PageShell
      title="Teams"
      description="Every registered boat and the names on their roster."
    >
      <div className="space-y-8">
        {directory.length === 0 ? (
          <p className="text-ink/70">No boats have registered yet.</p>
        ) : (
          <>
            {otherCount === 0 ? (
              <p className="text-ink/70">No other boats have registered yet.</p>
            ) : (
              <p className="text-ink/65">
                {directory.length} {directory.length === 1 ? "boat" : "boats"}{" "}
                on the list.
              </p>
            )}
            <ul className="space-y-5">
              {directory.map((team) => (
                <li
                  key={team.id}
                  className={`border px-4 py-4 md:px-5 ${
                    team.isOwn
                      ? "border-wave bg-mist/50"
                      : "border-wave/15 bg-paper"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl uppercase text-wave">
                      {team.teamName}
                    </h2>
                    {team.isOwn ? (
                      <span className="font-label text-[0.72rem] tracking-[0.12em] text-wave/70">
                        Your boat
                      </span>
                    ) : null}
                  </div>
                  {team.anglers.length === 0 ? (
                    <p className="mt-3 text-sm text-ink/60">
                      No names on the roster yet.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-1 text-ink/80">
                      {team.anglers.map((row, index) => (
                        <li key={`${team.id}:${index}:${row.name}`}>
                          {row.name}
                          {row.statusLabel ? ` · ${row.statusLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </PageShell>
  );
}
