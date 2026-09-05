import {
  FEE_PER_ANGLER_CENTS,
  SIDE_POT_BUY_IN_CENTS,
} from "@/lib/config";
import { formatUsd, formatUsdWhole } from "@/lib/money";
import type { PotTotals } from "@/lib/pots";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

export function PotBoard({ totals }: { totals: PotTotals }) {
  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:gap-7">
      {/* Main tournament pot */}
      <div className="double-frame flex flex-col gap-4 bg-paper p-5 md:p-7">
        <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
          Main tournament pot
        </h2>
        <p className="font-display text-[2.5rem] leading-none tracking-[0.02em] text-sun md:text-[4rem]">
          {formatUsdWhole(totals.mainPotCents)}
        </p>
        <p className="font-label text-[0.875rem] tracking-[0.1em] text-wave/70 md:text-base">
          {totals.teamCount} team{totals.teamCount === 1 ? "" : "s"} ·{" "}
          {totals.anglerCount} adult angler seat
          {totals.anglerCount === 1 ? "" : "s"} ×{" "}
          {formatUsd(FEE_PER_ANGLER_CENTS)}
        </p>
        <div className="grid grid-cols-3 border-y-[3px] border-double border-wave">
          {totals.payouts.map((payout, index) => (
            <div
              key={payout.place}
              className="border-r border-wave/25 px-3 py-4 text-center last:border-r-0 md:px-4 md:py-5"
            >
              <p className="text-xl md:text-2xl" aria-hidden>
                {MEDALS[index] ?? "★"}
              </p>
              <p className="font-label mt-1 text-[0.8rem] tracking-[0.1em] text-wave/70 md:text-[0.9rem]">
                {payout.place} · {payout.pct}%
              </p>
              <p className="font-display mt-1 text-[1.25rem] tracking-[0.02em] md:text-[1.75rem]">
                {formatUsdWhole(payout.amountCents)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[0.95rem] text-wave/70 md:text-base">
          Totals update automatically as teams register.
        </p>
      </div>

      {/* Side pots */}
      <div className="double-frame flex flex-col bg-paper p-5 md:p-7">
        <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
          Side pots
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {totals.sidePots.map((pot) => (
            <li
              key={pot.id}
              className="flex items-baseline justify-between gap-4 border-b border-wave/15 pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-[1rem] md:text-[1.05rem]">{pot.name}</p>
                <p className="font-label text-[0.8rem] tracking-[0.1em] text-wave/60 md:text-[0.875rem]">
                  {pot.entrantCount} team{pot.entrantCount === 1 ? "" : "s"} in
                  · winner takes all
                </p>
              </div>
              <p className="font-display text-[1.375rem] tracking-[0.02em] text-sun md:text-[1.75rem]">
                {formatUsdWhole(pot.totalCents)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-4 text-[0.95rem] text-wave/70 md:text-base">
          {formatUsdWhole(SIDE_POT_BUY_IN_CENTS)} per team, per pot — optional.
          Join when you register or at Friday&apos;s captain&apos;s meeting.
        </p>
      </div>
    </div>
  );
}
