import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { TeamRosterEditor } from "@/components/TeamRosterEditor";
import { getCurrentUser } from "@/lib/auth";
import {
  EVENT,
  FEE_PER_ANGLER_CENTS,
  isRegistrationOpen,
  YOUTH_TOURNAMENT,
} from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${YOUTH_TOURNAMENT.name} · ${EVENT.shortName}`,
  description: `${YOUTH_TOURNAMENT.tagline} Register a youth angler as a roster seat — parent login, host-funded biggest fish.`,
};

export default async function KidsPage() {
  const user = await getCurrentUser();
  const member = user
    ? await prisma.teamMember.findUnique({
        where: { userId: user.id },
        include: {
          team: {
            include: { anglers: { orderBy: { sortOrder: "asc" } } },
          },
        },
      })
    : null;
  const team = member?.team ?? null;
  const isRegistrant = Boolean(team && team.claimedByUserId === user?.id);
  const canEdit = isRegistrant && isRegistrationOpen();

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
              and stringer rules — same 2–4 cap, same “only registered
              anglers&apos; fish count.” They do not add{" "}
              {formatUsd(FEE_PER_ANGLER_CENTS)} to the team bill.
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
              Youth fish still count on the team stringer and on paid team
              side pots. Kids do not pay the adult entry, so they do not grow
              the main pot.
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
          {!user ? (
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
                My team. Kids count toward the four-angler cap, not the $75
                adult entry.
              </p>
              <TeamRosterEditor
                initialAnglers={team.anglers.map((a) => ({
                  id: a.id,
                  fullName: a.fullName,
                  phone: a.phone ?? "",
                  email: a.email ?? "",
                  isYouth: a.isYouth,
                }))}
                sidePotCount={team.sidePots.length}
                paymentStatus={
                  team.paymentStatus === "PAID" ? "PAID" : "UNPAID"
                }
                currentDueCents={team.amountDueCents}
                canEditRoster={canEdit}
                canInvite
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
