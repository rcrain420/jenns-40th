import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { RegistrationClosedNotice } from "@/components/RegistrationClosedNotice";
import { TeamRosterEditor } from "@/components/TeamRosterEditor";
import { getCurrentUser } from "@/lib/auth";
import {
  BOAT_ENTRY_CENTS,
  EVENT,
  isRegistrationOpen,
  YOUTH_TOURNAMENT,
} from "@/lib/config";
import { prisma } from "@/lib/db";
import { isBoatInviteLocked } from "@/lib/join-the-boat";
import { formatUsd } from "@/lib/money";
import { getRegistrationAvailability } from "@/lib/registration";
import { YOUTH_COMPETITION_POLICY } from "@/lib/youth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${YOUTH_TOURNAMENT.name} · ${EVENT.shortName}`,
  description: `${YOUTH_TOURNAMENT.tagline} Register a youth angler as a roster seat — parent login, host-funded biggest fish.`,
};

export default async function KidsPage() {
  const [user, availability] = await Promise.all([
    getCurrentUser(),
    getRegistrationAvailability(),
  ]);
  const member = user
    ? await prisma.teamMember.findUnique({
        where: { userId: user.id },
        include: {
          team: {
            include: {
              anglers: { orderBy: { sortOrder: "asc" } },
              members: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
        },
      })
    : null;
  const team = member?.team ?? null;
  const isRegistrant = Boolean(team && team.claimedByUserId === user?.id);
  const canEdit = isRegistrant && isRegistrationOpen();
  const inviteLocked = team
    ? isBoatInviteLocked({
        anglers: team.anglers,
        members: team.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
        })),
        captain: {
          name: team.captainName,
          email: team.captainEmail,
        },
      })
    : false;

  return (
    <PageShell
      title={YOUTH_TOURNAMENT.name}
      description={YOUTH_TOURNAMENT.tagline}
    >
      <article className="space-y-10">
        <section>
          <span className="section-banner">Celebration</span>
          <h2 className="mt-4 font-display text-2xl uppercase text-wave">
            This weekend is theirs too
          </h2>
          <p className="mt-3 text-ink/80">
            Jenn&apos;s birthday bash is a family tournament. Rowan and Rider
            are part of this weekend too — not a side note, and not a
            separate kids account. They fish on a real boat, on a real roster.
          </p>
          <p className="mt-3 text-ink/80">
            The {YOUTH_TOURNAMENT.name} is their own lane on the scale:
            heaviest qualifying fish by a registered youth angler, prize from
            Jenn and Aaron.
          </p>
        </section>

        <section>
          <span className="section-banner">How kids fish</span>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/80">
            <li>
              A youth angler is a roster seat for the {YOUTH_TOURNAMENT.name}{" "}
              — same 1–4 cap. They do not change the{" "}
              {formatUsd(BOAT_ENTRY_CENTS)} boat entry.
            </li>
            <li>
              A parent or legal guardian registers them. Kids can use a
              parent&apos;s email. They do not need their own account. Parent
              login is the login.
            </li>
            <li>
              The {YOUTH_TOURNAMENT.name} is biggest qualifying fish,
              host-funded, $0 to enter. Official winner is the Weighmaster at
              weigh-in — not the AI Livewell guess.
            </li>
            <li>
              {YOUTH_COMPETITION_POLICY} Kids do not change the boat entry, so
              they do not grow the main pot beyond that boat fee.
            </li>
          </ul>
          <p className="mt-4">
            <Link
              href="/rules#kids-pot"
              className="font-semibold text-sea underline-offset-4 hover:underline"
            >
              {YOUTH_TOURNAMENT.name} rules →
            </Link>
          </p>
        </section>

        <section>
          <span className="section-banner">Entry</span>
          {!availability.isOpen && !team ? (
            <div className="mt-4">
              <RegistrationClosedNotice
                openByDate={availability.openByDate}
                openByCapacity={availability.openByCapacity}
              />
            </div>
          ) : !user ? (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                Register the team and mark each youth angler as 17 or under.
                Same form — the youth fields will be emphasized.
              </p>
              <Link href="/register?youth=1" className="btn-bay btn-bay-red">
                Register a youth angler
              </Link>
            </div>
          ) : team && isRegistrant ? (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                Add youth anglers to {team.teamName} here. Same roster save as
                My team. Kids count toward the four-angler cap and do not
                change the $300 boat entry. They do not compete in the main
                stringer; they do count on paid team side pots and RowRide.
              </p>
              <TeamRosterEditor
                initialAnglers={team.anglers.map((a) => ({
                  id: a.id,
                  fullName: a.fullName,
                  phone: a.phone ?? "",
                  email: a.email ?? "",
                  isYouth: a.isYouth,
                  shirtSize: a.shirtSize ?? "",
                }))}
                sidePotCount={team.sidePots.length}
                paymentStatus={
                  team.paymentStatus === "PAID" ? "PAID" : "UNPAID"
                }
                currentDueCents={team.amountDueCents}
                canEditRoster={canEdit}
                canInvite
                boatInviteLocked={inviteLocked}
                defaultNewIsYouth
              />
            </div>
          ) : team ? (
            <p className="mt-4 text-ink/80">
              You&apos;re on {team.teamName}. Ask the person who registered
              the boat to add youth anglers from{" "}
              <Link href="/team" className="font-semibold text-sea hover:underline">
                My team
              </Link>
              .
            </p>
          ) : (
            <p className="mt-4 text-ink/80">
              You&apos;re signed in. Open{" "}
              <Link href="/team" className="font-semibold text-sea hover:underline">
                My team
              </Link>{" "}
              to add youth anglers once you&apos;re on a boat.
            </p>
          )}
        </section>
      </article>
    </PageShell>
  );
}
