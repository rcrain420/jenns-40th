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
  isYouthLandEntry,
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
  description: `${YOUTH_TOURNAMENT.tagline} Free youth tournament — fish from land or join a registered boat. Host-funded biggest fish.`,
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
  const landOnly = team ? isYouthLandEntry(team.entryKind) : false;
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
            separate kids account. Kids may fish from land, or optionally join
            a registered boat roster.
          </p>
          <p className="mt-3 text-ink/80">
            The {YOUTH_TOURNAMENT.name} is their own free lane on the scale:
            heaviest qualifying fish by a registered youth angler, prize from
            Tournament Host. Official winner is the Weighmaster — not Livewell
            AI.
          </p>
        </section>

        <section>
          <span className="section-banner">How kids fish</span>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/80">
            <li>
              RowRide is a separate free tournament. There is no entry fee.
              Biggest / heaviest qualifying fish wins at weigh-in.
            </li>
            <li>
              Kids do not compete in the adult main stringer or main pot.
            </li>
            <li>
              Kids are not required to be on a boat. Land-only entries are
              RowRide-only — no team side pots.
            </li>
            <li>
              Kids may optionally join a registered boat roster. They count
              toward that boat&apos;s 1–4 anglers and do not change the{" "}
              {formatUsd(BOAT_ENTRY_CENTS)} boat entry. Example: 3 adults + 1
              kid is still {formatUsd(BOAT_ENTRY_CENTS)} — the boat is full.
            </li>
            <li>
              If a kid is attached to a boat that entered paid side pots,
              their fish may count on those team side pots.
            </li>
            <li>
              A parent or legal guardian registers them. Kids can use a
              parent&apos;s email. They do not need their own account. Parent
              login is the login.
            </li>
            <li>{YOUTH_COMPETITION_POLICY}</li>
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
          {!availability.openByDate && !team ? (
            <div className="mt-4">
              <RegistrationClosedNotice
                openByDate={availability.openByDate}
                openByCapacity={availability.openByCapacity}
              />
            </div>
          ) : !user ? (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                {availability.isOpen
                  ? "Sign in, then enter from land with no boat, or register a boat and add kids on that roster (they count toward the 4)."
                  : "The 25-boat field is full. Land-only RowRide is still open — it does not use a boat slot."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register/youth" className="btn-bay btn-bay-red">
                  Enter from land
                </Link>
                {availability.isOpen ? (
                  <Link href="/register?youth=1" className="btn-bay btn-bay-navy">
                    Register a boat + kids
                  </Link>
                ) : null}
              </div>
            </div>
          ) : team && isRegistrant ? (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                {landOnly
                  ? `Add youth anglers to ${team.teamName} here. This is a land-only RowRide entry — $0, no boat seats, no team side pots.`
                  : `Add youth anglers to ${team.teamName} here. Kids count toward the 1–4 roster and do not change the $300 boat entry. They do not compete in the main stringer; they may count on paid team side pots and RowRide.`}
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
                canInvite={!landOnly}
                boatInviteLocked={inviteLocked}
                defaultNewIsYouth
                entryKind={team.entryKind}
              />
            </div>
          ) : team ? (
            <p className="mt-4 text-ink/80">
              You&apos;re on {team.teamName}. Ask the person who registered
              to add youth anglers from{" "}
              <Link href="/team" className="font-semibold text-sea hover:underline">
                My team
              </Link>
              .
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                {availability.isOpen
                  ? "You're signed in and not on a boat. Enter kids from land, or register a boat and add them on that roster (they count toward the 4)."
                  : "The 25-boat field is full. Land-only RowRide is still open — it does not use a boat slot."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register/youth" className="btn-bay btn-bay-red">
                  Enter from land
                </Link>
                {availability.isOpen ? (
                  <Link href="/register?youth=1" className="btn-bay btn-bay-navy">
                    Register a boat + kids
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </article>
    </PageShell>
  );
}
