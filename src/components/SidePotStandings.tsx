"use client";

import { LeaderboardPublic } from "@/components/LeaderboardPublic";
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

  if (variant === "tv") {
    return <SidePotTv board={board} />;
  }

  return (
    <LeaderboardPublic
      title="Side pot leaders"
      current="side-pots"
      session={board.session}
      pinnedSessionId={pinnedSessionId}
      footer="Winner takes the pool. AI Brag Board is for fun — these are official scale fish."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {board.pots.map((pot) => (
          <PotColumn key={pot.id} pot={pot} tv={false} />
        ))}
      </div>
    </LeaderboardPublic>
  );
}

function SidePotTv({ board }: { board: SidePotLeaderboard }) {
  const clock = useChicagoClock();
  const live = board.session?.status === "OPEN";
  const statusLabel = !board.session ? "Waiting" : live ? "Live" : "Final";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-wave text-paper">
      <header className="flex items-end justify-between gap-6 px-8 pb-4 pt-6">
        <div>
          <p className="font-label text-xl tracking-[0.18em] text-sun">
            {EVENT.shortName} · {statusLabel}
          </p>
          <h1 className="font-display text-5xl leading-none">Side pot leaders</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl tabular-nums">{clock || "—"}</p>
          <p className="text-paper/70">America/Chicago · {EVENT.venue}</p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-5 px-8">
        {board.pots.map((pot) => (
          <PotColumn key={pot.id} pot={pot} tv />
        ))}
      </div>

      <footer className="px-8 py-4 text-lg text-paper/75">
        Winner takes the pool. AI Brag Board is for fun — these are official scale fish. {EVENT.venue}.
      </footer>
    </div>
  );
}

function PotColumn({ pot, tv }: { pot: SidePotColumn; tv: boolean }) {
  const shown = tv ? pot.leaders.slice(0, 3) : pot.leaders;
  const leader = shown[0];
  const rest = shown.slice(1);
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
          <p className={`font-display leading-none break-words ${tv ? "text-5xl" : "text-3xl"}`}>
            {leader.teamName}
          </p>
          <p className={`mt-2 font-display text-sun ${tv ? "text-4xl" : "text-2xl"}`}>
            {leader.metricLabel}
          </p>
          <PotDetail leader={leader} potId={pot.id} />
        </div>
      ) : (
        <p className={`mt-6 ${tv ? "text-3xl" : "text-lg"}`}>Waiting on first fish.</p>
      )}

      {rest.length ? (
        <ol className={`mt-auto space-y-2 pt-4 ${tv ? "text-xl" : "text-sm"}`}>
          {rest.map((row) => (
            <li
              key={row.teamId}
              className="flex items-baseline justify-between gap-3 border-t border-current/15 pt-2"
            >
              <span className="min-w-0 break-words">
                #{row.place} {row.teamName}
              </span>
              <span className="shrink-0 tabular-nums">{row.metricLabel}</span>
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
