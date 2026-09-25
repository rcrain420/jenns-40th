"use client";

import { useChicagoClock, usePolledBoard } from "@/components/usePolledBoard";
import { EVENT } from "@/lib/config";
import { formatUsdWhole } from "@/lib/money";
import { formatChicagoTime, formatInches, formatWeightLbs } from "@/lib/weigh-scoring";
import type { SidePotColumn, SidePotLeaderboard } from "@/lib/weigh-board";

export function SidePotStandings({
  initial,
  variant,
  pinnedSessionId = null,
}: {
  initial: SidePotLeaderboard;
  variant: "public" | "tv";
  /** When set, the board stays on this session. Otherwise it follows the open one. */
  pinnedSessionId?: string | null;
}) {
  const board = usePolledBoard(initial, "/api/leaderboard/side-pots", pinnedSessionId);
  const clock = useChicagoClock();
  const tv = variant === "tv";
  const live = board.session?.status === "OPEN";

  return (
    <div
      className={
        tv
          ? "flex h-screen flex-col overflow-hidden bg-wave text-paper"
          : "mx-auto max-w-6xl px-5 py-8 text-wave md:px-11 md:py-11"
      }
    >
      <header className={tv ? "flex items-end justify-between gap-6 px-8 pb-4 pt-6" : "mb-6"}>
        <div>
          <p className={`font-label text-sun ${tv ? "text-xl tracking-[0.18em]" : "text-sm tracking-[0.16em]"}`}>
            {EVENT.shortName} · {live ? "Live" : "Final"}
          </p>
          <h1 className={`font-display leading-none ${tv ? "text-5xl" : "text-4xl md:text-5xl"}`}>
            Side pot leaders
          </h1>
        </div>
        <div className={tv ? "text-right" : "mt-3 text-sm text-wave/70"}>
          <p className={tv ? "font-display text-4xl tabular-nums" : "font-label tracking-[0.12em]"}>
            {clock || "—"}
          </p>
          <p className={tv ? "text-paper/70" : ""}>America/Chicago · {EVENT.venue}</p>
        </div>
      </header>

      <div className={tv ? "grid min-h-0 flex-1 grid-cols-3 gap-5 px-8" : "grid gap-5 md:grid-cols-3"}>
        {board.pots.map((pot) => (
          <PotColumn key={pot.id} pot={pot} tv={tv} />
        ))}
      </div>

      <footer className={tv ? "px-8 py-4 text-lg text-paper/75" : "mt-8 text-sm text-wave/60"}>
        Winner takes the pool. AI Brag Board is for fun — these are official scale fish. {EVENT.venue}.
      </footer>
    </div>
  );
}

function PotColumn({ pot, tv }: { pot: SidePotColumn; tv: boolean }) {
  const leader = pot.leaders[0];
  const rest = pot.leaders.slice(1, 3);
  return (
    <section
      className={
        tv
          ? "flex min-h-0 flex-col border border-paper/25 px-5 py-4"
          : "double-frame flex flex-col bg-paper p-5"
      }
    >
      <p className="font-label text-sm tracking-[0.14em] text-sun">{pot.name}</p>
      <p className={`mt-1 font-display text-sun ${tv ? "text-4xl" : "text-3xl"}`}>
        {formatUsdWhole(pot.poolCents)}
      </p>
      <p className={tv ? "text-paper/70" : "text-sm text-wave/60"}>
        Winner takes pool · {pot.entrantCount} in
      </p>

      {leader ? (
        <div className="mt-4">
          <p className={`font-display leading-none ${tv ? "text-5xl" : "text-3xl"}`}>{leader.teamName}</p>
          <p className={`mt-2 font-display text-sun ${tv ? "text-4xl" : "text-2xl"}`}>{leader.metricLabel}</p>
          <PotDetail leader={leader} potId={pot.id} />
        </div>
      ) : (
        <p className={`mt-6 ${tv ? "text-3xl" : "text-lg"}`}>Waiting on first fish.</p>
      )}

      {rest.length ? (
        <ol className={`mt-auto space-y-2 pt-4 ${tv ? "text-xl" : "text-sm"}`}>
          {rest.map((row) => (
            <li key={row.teamId} className="flex items-baseline justify-between gap-3 border-t border-current/15 pt-2">
              <span>
                #{row.place} {row.teamName}
              </span>
              <span className="tabular-nums">{row.metricLabel}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function PotDetail({
  leader,
  potId,
}: {
  leader: SidePotColumn["leaders"][number];
  potId: SidePotColumn["id"];
}) {
  const extra = potId === "trout" ? formatInches(leader.lengthInches) : formatWeightLbs(leader.weightLbs);
  return (
    <p className="mt-1 opacity-75">
      {extra} · {formatChicagoTime(leader.weighedAt)}
    </p>
  );
}
