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

        <section id="rules" className="scroll-mt-28">
          <span className="section-banner">Rules</span>
          <h2 className="mt-4 font-display text-2xl uppercase text-wave">
            Official-ish {YOUTH_TOURNAMENT.name} rules
          </h2>
          <p className="mt-3 text-ink/80">
            These are the kids / RowRide rules. The adult boat tournament has
            its own document.{" "}
            <Link
              href="/rules"
              className="font-semibold text-sea underline-offset-4 hover:underline"
            >
              Main tournament rules →
            </Link>
          </p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            1. A separate free tournament
          </h3>
          <p className="mt-3 text-ink/80">
            RowRide is a separate tournament from the adult boat tournament.
            There is no entry fee. Biggest / heaviest qualifying fish wins at
            weigh-in.
          </p>
          <p className="mt-3 text-ink/80">
            The prize is host-funded by Tournament Host, like the Heaviest
            Saltwater Catfish prize, and does not come from paid side-pot
            money.
          </p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            2. Who can enter
          </h3>
          <p className="mt-3 text-ink/80">
            Open to youth anglers — anglers 17 or younger whom a parent or
            legal guardian has registered. Kids can use a parent&apos;s email.
            They do not need their own account. Parent login is the login.
          </p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            3. How kids register
          </h3>
          <p className="mt-3 text-ink/80">
            Kids register only on the RowRide form. They are not added to a
            boat roster. Boat teams are adults only.
          </p>
          <p className="mt-3">
            <Link href="/register/youth" className="btn-bay btn-bay-red">
              Enter RowRide
            </Link>
          </p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            4. How kids fish
          </h3>
          <ul className="mt-3 list-disc space-y-3 pl-5 text-ink/80">
            <li>
              Kids fish from land. They are not required to be on a boat.
              Land-only entries are RowRide-only — no boat seats and no team
              side pots.
            </li>
            <li>
              On event day they may still fish from a boat if the captain or
              guide allows it — they are not added to that boat&apos;s roster.
              Guides often prefer no more than four anglers, so communicate
              in advance.
            </li>
            <li>
              When a youth angler is fishing from a boat, an adult should be
              on the boat.
            </li>
          </ul>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            5. What they compete for
          </h3>
          <p className="mt-3 text-ink/80">
            The heaviest qualifying fish caught by a registered youth angler
            wins. A qualifying fish must be legal, caught during tournament
            hours, presented whole and accepted by the Weighmaster. Official
            results come from weigh-in, not from AI Livewell estimates.
          </p>
          <p className="mt-3 text-ink/80">
            The youth angler must personally hook the fish and land it.
            Adults may help with safety. The child needs to do the fishing.
          </p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            6. What they do not compete in
          </h3>
          <ul className="mt-3 list-disc space-y-3 pl-5 text-ink/80">
            <li>
              Kids do not take one of a boat&apos;s 1–4 adult fishing seats
              and do not change the {formatUsd(BOAT_ENTRY_CENTS)} boat entry.
            </li>
            <li>
              Kids do not compete in the adult main stringer or main pot.
            </li>
            <li>
              RowRide kids do not count on a boat team&apos;s paid side pots.
            </li>
          </ul>
          <p className="mt-3 text-ink/80">{YOUTH_COMPETITION_POLICY}</p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            7. Licenses
          </h3>
          <p className="mt-3 text-ink/80">
            A Texas fishing license and saltwater endorsement are generally
            required for 17-year-olds. Younger children generally do not need
            a Texas fishing license. Check current Texas Parks and Wildlife
            Department rules.
          </p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            8. Weigh-in
          </h3>
          <p className="mt-3 text-ink/80">
            RowRide uses the same official scale, Weighmaster, and 2:00 p.m.
            weigh-in deadline as the adult boat tournament. There are no
            exceptions to that deadline.
          </p>

          <h3 className="mt-8 font-display text-lg uppercase tracking-wide text-sea">
            9. The final word
          </h3>
          <p className="mt-3 text-ink/80">
            Everyone must behave safely, honestly and respectfully. The
            Weighmaster has final authority over species, condition,
            measurement, and official weight. All decisions are final.
          </p>
          <p className="mt-4">
            <Link
              href="/rules"
              className="font-semibold text-sea underline-offset-4 hover:underline"
            >
              Adult boat tournament rules →
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
