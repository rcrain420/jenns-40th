import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import {
  EVENT,
  getVenmoPayUrl,
  PAID_SIDE_POTS,
  SIDE_POT_BUY_IN_CENTS,
  VENMO_HANDLE,
} from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ team?: string }>;
};

export default async function RegisterSuccessPage({ searchParams }: Props) {
  const { team: teamId } = await searchParams;
  if (!teamId) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
  });

  if (!team) notFound();

  const chosenPots = PAID_SIDE_POTS.filter((pot) =>
    team.sidePots.includes(pot.id),
  );
  const venmoNote = [
    `${team.teamName} — tournament`,
    ...chosenPots.map((pot) => pot.noteLabel),
  ].join(" + ");
  const venmoPayUrl = getVenmoPayUrl({
    amountCents: team.amountDueCents,
    note: venmoNote,
  });

  return (
    <PageShell
      narrow
      eyebrow="You're registered"
      title={team.teamName}
      description={
        <>
          Amount due:{" "}
          <span className="font-semibold text-coral">
            {formatUsd(team.amountDueCents)}
          </span>{" "}
          ({team.anglers.length} anglers
          {team.sidePots.length > 0
            ? ` + ${team.sidePots.length} side pot${
                team.sidePots.length > 1 ? "s" : ""
              }`
            : ""}
          )
        </>
      }
    >
      <div className="space-y-8">
        <section>
          <span className="section-banner">Next step: Venmo</span>
          <p className="mt-3 text-ink/75">
            Send payment to{" "}
            <a
              href={venmoPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sea hover:underline"
            >
              {VENMO_HANDLE}
            </a>
            . Use the note below so we can match your payment — it names your{" "}
            <strong>team</strong>
            {chosenPots.length > 0 ? (
              <>
                {" "}
                and the <strong>side pot(s)</strong> you entered
              </>
            ) : null}
            .
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 border border-wave/15 bg-mist/60 px-6 py-8 text-center">
            <p className="font-display text-2xl tracking-wide text-wave">
              {VENMO_HANDLE}
            </p>
            <div className="max-w-sm space-y-3 text-left text-sm text-ink/75">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                  Venmo note
                </p>
                <p className="mt-1.5 border border-wave/15 bg-paper px-3 py-2.5 font-mono text-ink">
                  {venmoNote}
                </p>
              </div>
              {chosenPots.length > 0 ? (
                <div>
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                    Side pots included
                  </p>
                  <ul className="mt-1.5 space-y-1.5 font-mono text-ink">
                    {chosenPots.map((pot) => (
                      <li
                        key={pot.id}
                        className="border border-wave/15 bg-paper px-3 py-2"
                      >
                        {pot.name} — {formatUsd(SIDE_POT_BUY_IN_CENTS)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-ink/60">
                  No side pots selected — you can still join any of them via
                  Venmo at Friday&apos;s captain&apos;s meeting (
                  {formatUsd(SIDE_POT_BUY_IN_CENTS)} per team, per pot).
                </p>
              )}
            </div>
            <a
              href={venmoPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full max-w-xs items-center justify-center bg-wave px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-paper hover:bg-sea"
            >
              Open Venmo to pay
            </a>
            <p className="max-w-xs text-sm text-ink/60">
              On your phone, tap the button or QR to open Venmo with the amount
              and note filled in. Scanning works from another device.
            </p>
            <a
              href={venmoPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Venmo to pay"
              className="block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/venmo-qr.png"
                alt="Venmo QR code for @Officialish-Tournament"
                className="h-52 w-52 bg-paper object-contain"
              />
            </a>
          </div>
        </section>

        <section className="border-t border-dashed border-wave/25 pt-8">
          <h2 className="font-display text-2xl uppercase text-wave">
            Team summary
          </h2>
          <dl className="mt-4 space-y-3 text-sm md:text-base">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Event</dt>
              <dd className="text-right">{EVENT.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Boat</dt>
              <dd>{team.boatType === "GUIDED" ? "Guided" : "Non-guided"}</dd>
            </div>
            {team.boatType === "GUIDED" ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Captain</dt>
                <dd className="text-right">
                  {team.captainName}
                  {team.captainPhone ? ` · ${team.captainPhone}` : ""}
                </dd>
              </div>
            ) : (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Primary contact</dt>
                <dd className="text-right">
                  {team.contactName}
                  {team.contactPhone ? ` · ${team.contactPhone}` : ""}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Anglers</dt>
              <dd className="text-right">
                {team.anglers.map((a) => a.fullName).join(", ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Payment</dt>
              <dd className="font-semibold text-alert">Unpaid</dd>
            </div>
          </dl>
        </section>

        <p className="font-script text-center text-3xl text-sun">
          See you in Rockport!
        </p>
      </div>
    </PageShell>
  );
}
