import Link from "next/link";
import { InviteLinkCopy } from "@/components/InviteLinkCopy";
import { PageShell } from "@/components/PageShell";
import { TeamRosterEditor } from "@/components/TeamRosterEditor";
import { getCurrentUser } from "@/lib/auth";
import { isRegistrationOpen } from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  boatRosterStatusLabel,
  buildBoatRoster,
} from "@/lib/join-the-boat";
import { formatUsd } from "@/lib/money";
import { teamInviteUrl } from "@/lib/team-invite";

export const dynamic = "force-dynamic";

export default async function MyTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; unlocked?: string }>;
}) {
  const { joined, unlocked } = await searchParams;
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
            include: { user: { select: { id: true, name: true, email: true } } },
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
          Register a team — you add the captain and invite teammates — or ask
          the person who registered for their invite link. Captains might never
          log in.
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
  const boatRoster = buildBoatRoster({
    anglers: team.anglers.map((a) => ({
      fullName: a.fullName,
      email: a.email,
    })),
    members: team.members.map((m) => ({
      name: m.user.name,
      email: m.user.email,
    })),
  });
  const registrantEmail =
    team.members.find((m) => m.user.id === team.claimedByUserId)?.user.email ??
    null;

  return (
    <PageShell
      narrow
      title={team.teamName}
      description={`${formatUsd(team.amountDueCents)} due · ${team.anglers.length} anglers on the official roster`}
    >
      <div className="space-y-10">
        {joined === "1" ? (
          <p className="rounded-md bg-mist px-4 py-3 text-sm text-wave">
            You’re on {team.teamName}. The Livewell is unlocked here — you can
            post without a PIN or a second unlock.
          </p>
        ) : null}
        {unlocked === "1" ? (
          <p className="rounded-md bg-mist px-4 py-3 text-sm text-wave">
            You’re signed in on this device. The Livewell is unlocked here — no
            PIN needed. Invite teammates below.
          </p>
        ) : null}

        <section>
          <span className="section-banner">Invite the boat</span>
          <p className="mt-3 text-ink/75">
            {isRegistrant
              ? "You registered this boat, so you invite teammates. Add the captain yourself if you have one — they might never log in. Adding an email on a seat (here via Invite, or at register) sends Join the boat. After they join they can see the team and post on the Livewell — no PIN or second unlock. Name-only seats stay on the PIN / shared-link path. Joining does not add them to the paid roster — add fishing names below if they’re in the boat."
              : "You’re on this boat. After you joined, the Livewell is unlocked here — no PIN or extra email confirm. Joining did not make you the captain or add you to the paid roster."}
          </p>
          <div className="mt-4">
            <InviteLinkCopy url={inviteUrl} />
          </div>
        </section>

        <section>
          <span className="section-banner">On this boat</span>
          <ul className="mt-3 space-y-1 text-ink/80">
            {boatRoster.map((row, index) => (
              <li key={`${index}:${row.email ?? row.name}`}>
                {row.name}
                {row.email &&
                registrantEmail &&
                row.email === registrantEmail.trim().toLowerCase()
                  ? " · registered the team"
                  : ""}
                {" · "}
                {boatRosterStatusLabel(row.status)}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <span className="section-banner">Official roster</span>
          {isRegistrant ? (
            <div className="mt-4">
              <TeamRosterEditor
                initialAnglers={team.anglers.map((a) => ({
                  id: a.id,
                  fullName: a.fullName,
                  phone: a.phone ?? "",
                  email: a.email ?? "",
                }))}
                sidePotCount={team.sidePots.length}
                paymentStatus={
                  team.paymentStatus === "PAID" ? "PAID" : "UNPAID"
                }
                currentDueCents={team.amountDueCents}
                canEditRoster={canEdit}
                canInvite
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-1 text-ink/80">
              {team.anglers.map((a) => (
                <li key={a.id}>{a.fullName}</li>
              ))}
              <p className="mt-3 text-sm text-ink/60">
                Only the person who registered can change paid names or send
                invites.
              </p>
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
