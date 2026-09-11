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
  description: `${YOUTH_TOURNAMENT.tagline} Free youth tournament — register kids on their own RowRide form. Host-funded biggest fish.`,
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
            RowRide Youth Anglers Tournament — Celebrating Rowan + Rider&apos;s
            10th Birthday!
          </h2>
          <p className="mt-3 text-ink/80">
            Jenn&apos;s Birthday Bash is a family tournament, and Rowan and
            Rider are a big part of the weekend too. Even better, they share
            their birthday weekend with Jenn — all three celebrate on October
            12th!
          </p>
          <p className="mt-3 text-ink/80">
            Kids register separately for RowRide and fish from land. On event
            day they may still fish from a boat if the captain or guide
            allows it — they are not added to a boat roster.
          </p>
          <p className="mt-3 text-ink/80">
            The RowRide Youth Anglers Tournament gives the kids their own
            free competition at the scales. The registered youth angler with
            the heaviest qualifying fish takes the prize, provided by the
            Tournament Host.
          </p>
          <p className="mt-3 text-ink/80">
            Just like the main tournament, the Weighmaster has the final say
            on the official winner — not Livewell AI.
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
              Kids are not required to be on a boat. They register on the
              separate RowRide form — land-only entries are RowRide-only, with
              no boat seats and no team side pots.
            </li>
            <li>
              Boat teams are adults only. Kids do not take one of a
              boat&apos;s 1–4 adult fishing seats and do not change the{" "}
              {formatUsd(BOAT_ENTRY_CENTS)} boat entry. On event day they may
              fish from a boat if the captain or guide allows it — guides
              often prefer no more than four anglers, so communicate in
              advance.
            </li>
            <li>
              RowRide kids do not count on a boat team&apos;s paid side pots.
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
                  ? "Sign in, then enter kids from land on the RowRide form. Boat registration is a separate adults-only path."
                  : "The 25-boat field is full. Land-only RowRide is still open — it does not use a boat slot."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register/youth" className="btn-bay btn-bay-red">
                  Enter from land
                </Link>
                {availability.isOpen ? (
                  <Link href="/register" className="btn-bay btn-bay-navy">
                    Register a boat
                  </Link>
                ) : null}
              </div>
            </div>
          ) : team && isRegistrant && landOnly ? (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                Add youth anglers to {team.teamName} here. This is a land-only
                RowRide entry — $0, no boat seats, no team side pots.
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
                  team.paymentStatus === "PAID"
                    ? "PAID"
                    : team.paymentStatus === "PARTIAL"
                      ? "PARTIAL"
                      : "UNPAID"
                }
                currentDueCents={team.amountDueCents}
                amountPaidCents={team.amountPaidCents}
                canEditRoster={canEdit}
                canInvite={false}
                boatInviteLocked={inviteLocked}
                defaultNewIsYouth
                entryKind={team.entryKind}
              />
            </div>
          ) : team && isRegistrant ? (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                You&apos;re on boat team {team.teamName}. Kids are not added
                to a boat roster. Another parent or guardian who is not already
                on a team can enter them for RowRide.
              </p>
              <Link href="/register/youth" className="btn-bay btn-bay-red">
                RowRide signup
              </Link>
            </div>
          ) : team ? (
            <p className="mt-4 text-ink/80">
              You&apos;re on {team.teamName}. Kids register separately for
              RowRide — they are not added to a boat roster.{" "}
              <Link href="/team" className="font-semibold text-sea hover:underline">
                My team
              </Link>
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-ink/80">
                {availability.isOpen
                  ? "You're signed in and not on a team. Enter kids from land on the RowRide form. Boat registration is a separate adults-only path."
                  : "The 25-boat field is full. Land-only RowRide is still open — it does not use a boat slot."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register/youth" className="btn-bay btn-bay-red">
                  Enter from land
                </Link>
                {availability.isOpen ? (
                  <Link href="/register" className="btn-bay btn-bay-navy">
                    Register a boat
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
