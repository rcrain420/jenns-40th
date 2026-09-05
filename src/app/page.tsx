import Image from "next/image";
import Link from "next/link";
import { BragBoard } from "@/components/BragBoard";
import { Countdown } from "@/components/Countdown";
import { PotBoard } from "@/components/PotBoard";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { listBragBoardCatches } from "@/lib/catches";
import {
  EVENT,
  FEE_PER_ANGLER_CENTS,
  listedPots,
  MAX_ANGLERS,
  remainingUntil,
  YOUTH_TOURNAMENT,
} from "@/lib/config";
import { getPotTotals } from "@/lib/pots";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

const SIDE_POTS = listedPots();

const FRIDAY_BULLETS = [
  "Team check-in",
  "Rules review",
  "Side pot sign-up",
] as const;

export default async function HomePage() {
  const [availability, bragRows, potTotals, account] = await Promise.all([
    getRegistrationAvailability(),
    listBragBoardCatches(5),
    getPotTotals(),
    getCurrentUser(),
  ]);

  const countdownTarget = new Date(EVENT.countdownTargetIso);
  const initialCountdown = remainingUntil(countdownTarget);
  const feeLabel = `$${FEE_PER_ANGLER_CENTS / 100}`;
  const teamFeeLabel = `$${((FEE_PER_ANGLER_CENTS * MAX_ANGLERS) / 100).toLocaleString("en-US")}`;

  return (
    <main className="flex-1 bg-paper text-wave">
      <SiteHeader account={account} />

      {/* Hero — composed poster art carries the title treatment */}
      <section className="relative overflow-hidden bg-[#e8d7b4]">
        <h1 className="sr-only">
          Official-ish Fishing Tournament — {EVENT.heroKicker}
        </h1>
        <Image
          src="/brand/hero-tournament-v2.png"
          alt="Official-ish Fishing Tournament — Jenn's 40th Birthday Bay Bash at Boatmen's Cove Harbor, Rockport, Texas, October 9–10, 2026"
          width={2048}
          height={1152}
          priority
          className="animate-rise h-auto w-full"
          sizes="100vw"
        />
      </section>

      {/* Date + countdown */}
      <section className="bg-sun px-5 py-5 text-paper md:px-11 md:py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 md:flex-row md:gap-10">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-xl md:text-[1.375rem]" aria-hidden>
              ★
            </span>
            <p className="font-display text-[1.875rem] tracking-[0.03em] md:text-[3.25rem] md:tracking-[0.04em]">
              {EVENT.dateBand}
            </p>
            <span className="text-xl md:text-[1.375rem]" aria-hidden>
              ★
            </span>
          </div>

          <Countdown
            targetIso={EVENT.countdownTargetIso}
            initial={{
              days: initialCountdown.days,
              hours: initialCountdown.hours,
              minutes: initialCountdown.minutes,
              seconds: initialCountdown.seconds,
            }}
          />

          {availability.isOpen ? (
            <Link
              href="/register"
              className="btn-bay btn-bay-navy w-full text-center md:hidden"
            >
              Register your team
            </Link>
          ) : (
            <span className="btn-bay w-full border-2 border-paper/40 text-center text-paper/70 md:hidden">
              Registration closed
            </span>
          )}
        </div>
      </section>

      {/* Schedule */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 md:grid-cols-2 md:gap-7 md:px-11 md:py-11">
        <div className="double-frame bg-paper p-5 md:p-7">
          <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
            Friday, October 9
          </h2>
          <div className="mt-5">
            <p className="font-label text-[0.95rem] tracking-[0.12em] text-sun md:text-[1.25rem]">
              Captain&apos;s Meeting
            </p>
            <p className="font-display text-[1.75rem] tracking-[0.02em] md:text-[2.5rem]">
              7:00 PM
            </p>
          </div>
          <ul className="mt-3.5 flex flex-col gap-3 text-[1.05rem] md:text-[1.125rem]">
            {FRIDAY_BULLETS.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-sun" aria-hidden>
                  ★
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="double-frame bg-paper p-5 md:p-7">
          <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
            Saturday, October 10
          </h2>
          <div className="mt-5 flex gap-8 md:gap-10">
            <div>
              <p className="font-label text-[0.95rem] tracking-[0.12em] text-sun md:text-[1.25rem]">
                First cast
              </p>
              <p className="font-display text-[1.75rem] tracking-[0.02em] md:text-[2.5rem]">
                SUNRISE
              </p>
            </div>
            <div>
              <p className="font-label text-[0.95rem] tracking-[0.12em] text-sun md:text-[1.25rem]">
                Weigh-in
              </p>
              <p className="font-display text-[1.75rem] tracking-[0.02em] md:text-[2.5rem]">
                2:00 PM
              </p>
            </div>
          </div>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-wave/75 md:text-[1.05rem]">
            Weigh-in time is final. Late arrivals are disqualified — no
            exceptions, no matter how good the story is.
          </p>
        </div>
      </section>

      {/* Facts strip */}
      <section className="mx-auto max-w-6xl px-5 md:px-11">
        <div className="grid grid-cols-2 border-y-[3px] border-double border-wave md:grid-cols-5">
          <FactCell value={String(MAX_ANGLERS)} label="Anglers per team" />
          <FactCell value="1" label="Boat per team" />
          <FactCell
            value={feeLabel}
            label={`Per adult · ${teamFeeLabel} team`}
            accent
          />
          <FactCell value="GUIDED OR NOT" label="Both welcome" compact />
          <FactCell
            value="TEAM SHIRTS"
            label="Encouraged"
            compact
            className="col-span-2 border-r-0 md:col-span-1"
          />
        </div>
      </section>

      {/* Stringer + side pots */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 md:grid-cols-[1.1fr_1fr] md:gap-7 md:px-11 md:py-11">
        <div className="double-frame flex flex-col gap-4 p-5 md:p-7">
          <h2 className="font-display text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
            Tournament stringer
          </h2>
          <p className="font-display text-[2rem] tracking-[0.02em] text-sun md:text-[3.5rem]">
            3 REDFISH + 1 TROUT
          </p>
          <p className="text-[1.05rem] leading-relaxed md:text-[1.125rem]">
            Heaviest legal stringer wins — up to three redfish and one spotted
            seatrout. A full four-fish stringer is not required. All fish must
            meet Texas Parks &amp; Wildlife regulations.
          </p>
          {availability.isOpen ? (
            <Link
              href="/register"
              className="btn-bay btn-bay-red mt-1 self-start"
            >
              Register your team
            </Link>
          ) : (
            <span className="btn-bay mt-1 self-start border-2 border-wave/30 text-wave/50">
              Registration closed
            </span>
          )}
        </div>

        <div className="double-frame p-5 md:p-7">
          <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
            Side pots
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-2.5 text-[1rem] sm:grid-cols-2 sm:gap-x-5 md:text-[1.05rem]">
            {SIDE_POTS.map((pot) => (
              <li key={pot.id} className="flex gap-2.5">
                <span className="text-sun" aria-hidden>
                  ★
                </span>
                <span>
                  {pot.name}{" "}
                  <span className="text-wave/60">({pot.buyInLabel})</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.95rem] text-wave/70 md:text-base">
            Paid pots via Venmo at Friday&apos;s captain&apos;s meeting. Catfish
            is free — every team is already in. The{" "}
            <Link href="/kids" className="text-sun underline-offset-2 hover:underline">
              {YOUTH_TOURNAMENT.name}
            </Link>{" "}
            is also free and host-funded — {YOUTH_TOURNAMENT.tagline} Heaviest
            qualifying fish by a registered youth angler. Youth do not pay the
            $75 adult entry.{" "}
            <Link href="/rules#kids-pot" className="text-sun underline-offset-2 hover:underline">
              {YOUTH_TOURNAMENT.name} rules →
            </Link>
          </p>
        </div>
      </section>

      {/* Pot calculator */}
      <section className="mx-auto max-w-6xl px-5 pb-8 md:px-11 md:pb-11">
        <PotBoard totals={potTotals} />
        <p className="mt-4 text-right text-[0.95rem] md:text-base">
          <Link
            href="/pots"
            className="text-sun underline-offset-2 hover:underline"
          >
            Full pot breakdown →
          </Link>
        </p>
      </section>

      <BragBoard rows={bragRows} />

      {/* Venue */}
      <section className="mx-auto grid max-w-6xl md:grid-cols-2">
        <div className="relative min-h-[220px] bg-map md:min-h-[360px]">
          <iframe
            title="Map of Cove Harbor, Rockport TX"
            src={EVENT.mapEmbedUrl}
            className="absolute inset-0 h-full w-full border-0 grayscale-[0.15] contrast-[1.05]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="flex flex-col gap-4 px-5 py-8 md:px-11 md:py-12">
          <p className="font-label text-[0.95rem] tracking-[0.18em] text-sun md:text-[1.05rem]">
            Where to show up
          </p>
          <h2 className="font-display text-[1.875rem] leading-none tracking-[0.02em] md:text-[2.875rem]">
            Boatmen&apos;s Club
            <br />
            Bar &amp; Marina
          </h2>
          <p className="text-[1.05rem] leading-relaxed md:text-[1.125rem]">
            140 Cove Harbor N
            <br />
            Rockport, TX 78382
          </p>
          <p className="text-[1rem] leading-relaxed text-wave/75 md:text-[1.05rem]">
            Park at Cove Harbor and walk to the dock. Weigh-in is at the end of
            the pier.
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <a
              href={EVENT.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-bay btn-bay-navy"
            >
              Get directions
            </a>
            <Link href="/guides" className="btn-bay btn-bay-outline">
              Find a guide
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sun px-5 py-7 text-paper md:px-11 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
          <p className="font-display text-[1.05rem] tracking-[0.1em] md:text-[1.75rem]">
            {EVENT.tagline}
          </p>
          <p className="font-script text-[1.75rem] md:text-[2.375rem]">
            {EVENT.footerScript}
          </p>
        </div>
      </footer>
    </main>
  );
}

function FactCell({
  value,
  label,
  accent = false,
  compact = false,
  className = "",
}: {
  value: string;
  label: string;
  accent?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`border-b border-wave/25 px-4 py-5 text-center last:border-b-0 odd:border-r even:border-r-0 md:border-b-0 md:border-r md:px-5 md:py-6 md:last:border-r-0 ${className}`}
    >
      <p
        className={`font-display ${
          compact
            ? "pt-1 text-[1.25rem] md:text-[1.625rem]"
            : "text-[1.875rem] md:text-[2.5rem]"
        } ${accent ? "text-sun" : "text-wave"}`}
      >
        {value}
      </p>
      <p className="font-label mt-1 text-[0.875rem] tracking-[0.1em] md:text-base">
        {label}
      </p>
    </div>
  );
}
