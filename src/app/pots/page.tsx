import Link from "next/link";
import { PotBoard } from "@/components/PotBoard";
import { SiteHeader } from "@/components/SiteHeader";
import {
  FEE_PER_ANGLER_CENTS,
  HOST_FUNDED_POTS,
  MAIN_POT_SPLITS,
  SIDE_POT_BUY_IN_CENTS,
  YOUTH_TOURNAMENT,
} from "@/lib/config";
import { formatUsd } from "@/lib/money";
import { getCurrentUser } from "@/lib/auth";
import { getPotTotals } from "@/lib/pots";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pot Total",
};

export default async function PotsPage() {
  const [totals, availability, account] = await Promise.all([
    getPotTotals(),
    getRegistrationAvailability(),
    getCurrentUser(),
  ]);

  const splitLabel = MAIN_POT_SPLITS.map(
    (s) => `${s.pct}% to ${s.place}`,
  ).join(", ");

  return (
    <main className="flex-1 bg-paper text-wave">
      <SiteHeader account={account} />

      <div className="bg-wave pb-12 pt-10 text-paper">
        <div className="mx-auto max-w-6xl px-5 md:px-11">
          <p className="animate-rise font-label text-sm tracking-[0.18em] text-paper/70">
            Live totals
          </p>
          <h1 className="animate-rise mt-2 font-display text-4xl leading-tight tracking-[0.04em] md:text-5xl">
            Pot Total
          </h1>
          <p className="animate-rise-delay mt-3 max-w-xl text-paper/85">
            Every entry fee goes straight into the pot, and the pot grows as
            teams register. Here&apos;s where it stands right now.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-11 md:py-11">
        <PotBoard totals={totals} />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 md:px-11 md:pb-14">
        <div className="double-frame bg-paper p-5 md:p-7">
          <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
            How the pots work
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-[1.05rem] md:text-[1.125rem]">
            <li className="flex gap-3">
              <span className="text-sun" aria-hidden>
                ★
              </span>
              <span>
                Main tournament: {formatUsd(FEE_PER_ANGLER_CENTS)} per adult
                angler, all of it in the pot — paid out {splitLabel}. Youth
                seats do not add to this pot.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-sun" aria-hidden>
                ★
              </span>
              <span>
                Side pots: optional {formatUsd(SIDE_POT_BUY_IN_CENTS)} per
                team, per pot. Each side pot is winner-take-all. Enter when you
                register or at Friday&apos;s captain&apos;s meeting.
              </span>
            </li>
            {HOST_FUNDED_POTS.map((pot) => (
              <li key={pot.id} className="flex gap-3">
                <span className="text-sun" aria-hidden>
                  ★
                </span>
                <span>
                  {pot.name} is {pot.buyInLabel.toLowerCase()}
                  {pot.buyInCents === 0 ? " ($0)" : ""} — host-funded by Jenn
                  and Aaron
                  {pot.id === "kids"
                    ? `. ${YOUTH_TOURNAMENT.tagline} Heaviest qualifying fish by a registered youth angler. Youth do not pay the $75 adult entry.`
                    : ", and every team is already in."}
                  {pot.href ? (
                    <>
                      {" "}
                      <Link
                        href={pot.href}
                        className="text-sun underline-offset-2 hover:underline"
                      >
                        {YOUTH_TOURNAMENT.name} →
                      </Link>
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {availability.isOpen ? (
              <Link href="/register" className="btn-bay btn-bay-red">
                Register your team
              </Link>
            ) : (
              <span className="btn-bay border-2 border-wave/30 text-wave/50">
                Registration closed
              </span>
            )}
            <Link
              href="/rules#side-pots"
              className="text-sun underline-offset-2 hover:underline"
            >
              Full side pot rules →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
