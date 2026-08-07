import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EVENT, getVenmoPayUrl, VENMO_HANDLE } from "@/lib/config";
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

  const venmoNote = `${team.teamName} — tournament`;
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
          ({team.anglers.length} anglers)
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
            . In the Venmo note, include your{" "}
            <strong>team name</strong> and whether the payment is for the{" "}
            <strong>tournament</strong> or which <strong>side pot(s)</strong>{" "}
            (heaviest spotted seatrout, blackjack redfish, and/or most spots) so
            we can match it correctly.
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 border border-wave/15 bg-mist/60 px-6 py-8 text-center">
            <p className="font-display text-2xl tracking-wide text-wave">
              {VENMO_HANDLE}
            </p>
            <div className="max-w-sm space-y-3 text-left text-sm text-ink/75">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                  Tournament note
                </p>
                <p className="mt-1.5 border border-wave/15 bg-paper px-3 py-2.5 font-mono text-ink">
                  {venmoNote}
                </p>
              </div>
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                  Side pot notes
                </p>
                <ul className="mt-1.5 space-y-1.5 font-mono text-ink">
                  <li className="border border-wave/15 bg-paper px-3 py-2">
                    {team.teamName} — heaviest trout
                  </li>
                  <li className="border border-wave/15 bg-paper px-3 py-2">
                    {team.teamName} — blackjack redfish
                  </li>
                  <li className="border border-wave/15 bg-paper px-3 py-2">
                    {team.teamName} — most spots
                  </li>
                  <li className="border border-wave/15 bg-paper px-3 py-2">
                    {team.teamName} — trout + blackjack
                  </li>
                </ul>
                <p className="mt-2 text-ink/60">
                  Name every side pot in the note when paying for more than one.
                </p>
              </div>
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
