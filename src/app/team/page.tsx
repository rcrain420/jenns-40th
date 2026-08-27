import Link from "next/link";
import { InviteLinkCopy } from "@/components/InviteLinkCopy";
import { PageShell } from "@/components/PageShell";
import { TeamRosterEditor } from "@/components/TeamRosterEditor";
import { getCurrentUser } from "@/lib/auth";
import { isRegistrationOpen } from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/money";
import { teamInviteUrl } from "@/lib/team-invite";

export const dynamic = "force-dynamic";

export default async function MyTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const { joined } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <PageShell
        narrow
        title="My team"
        description="Sign in to see your boat and invite link."
      >
        <p className="text-ink/70">
          <Link href="/login?next=/team" className="font-semibold text-sea hover:underline">
            Sign in
          </Link>{" "}
          first.
        </p>
      </PageShell>
    );
  }

  const member = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          anglers: { orderBy: { sortOrder: "asc" } },
          members: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!member) {
    return (
      <PageShell
        narrow
        title="My team"
        description="You’re not on a boat yet."
      >
        <p className="text-ink/70">
          Register a team, or ask a teammate to text you their invite link.
        </p>
        <p className="mt-4">
          <Link href="/register" className="font-semibold text-sea hover:underline">
            Register a team
          </Link>
        </p>
      </PageShell>
    );
  }

  const team = member.team;
  const isRegistrant = team.claimedByUserId === user.id;
  const canEdit = isRegistrant && isRegistrationOpen();
  const inviteUrl = teamInviteUrl(team.id);

  return (
    <PageShell
      narrow
      title={team.teamName}
      description={`${formatUsd(team.amountDueCents)} due · ${team.anglers.length} anglers on the official roster`}
    >
      <div className="space-y-10">
        {joined === "1" ? (
          <p className="rounded-md bg-mist px-4 py-3 text-sm text-wave">
            You’re on {team.teamName}. Livewell posts will show this team name.
          </p>
        ) : null}

        <section>
          <span className="section-banner">Invite the boat</span>
          <p className="mt-3 text-ink/75">
            You registered this boat, so you invite teammates. Add the captain
            yourself if you have one — they might never log in. Teammates
            create an account and land on the team without confirming email
            first. Joining does not add them to the paid roster — add fishing
            names below if they&apos;re in the boat.
          </p>
          <div className="mt-4">
            <InviteLinkCopy url={inviteUrl} />
          </div>
        </section>

        <section>
          <span className="section-banner">On this account</span>
          <ul className="mt-3 space-y-1 text-ink/80">
            {team.members.map((m) => (
              <li key={m.id}>
                {m.user.name}
                {m.user.id === team.claimedByUserId ? " · registered the team" : ""}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <span className="section-banner">Official roster</span>
          {canEdit ? (
            <div className="mt-4">
              <TeamRosterEditor
                initialAnglers={team.anglers.map((a) => ({
                  fullName: a.fullName,
                  phone: a.phone ?? "",
                }))}
                sidePotCount={team.sidePots.length}
                paymentStatus={
                  team.paymentStatus === "PAID" ? "PAID" : "UNPAID"
                }
                currentDueCents={team.amountDueCents}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-1 text-ink/80">
              {team.anglers.map((a) => (
                <li key={a.id}>{a.fullName}</li>
              ))}
              {!isRegistrant ? (
                <p className="mt-3 text-sm text-ink/60">
                  Only the person who registered can change paid names.
                </p>
              ) : (
                <p className="mt-3 text-sm text-ink/60">
                  Registration is closed. Ask an organizer to change the roster.
                </p>
              )}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
