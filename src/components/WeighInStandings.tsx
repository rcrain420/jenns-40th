"use client";

import { useEffect, useState } from "react";
import { LeaderboardPublic } from "@/components/LeaderboardPublic";
import { useChicagoClock, usePolledBoard } from "@/components/usePolledBoard";
import { EVENT } from "@/lib/config";
import { formatChicagoTime, formatWeightLbs } from "@/lib/weigh-scoring";
import { slotWeightText, type WeighInLeaderboard, type WeighInRankRow } from "@/lib/weigh-board";

function useRankFlash(ranks: WeighInLeaderboard["ranks"]) {
  const signature = ranks.map((row) => `${row.teamId}:${row.rank}`).join("|");
  const [snapshot, setSnapshot] = useState(signature);
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map());
  const [flash, setFlash] = useState<Set<string>>(new Set());

  if (signature !== snapshot) {
    const changed = new Set<string>();
    for (const row of ranks) {
      const prior = previousRanks.get(row.teamId);
      if (prior != null && prior !== row.rank) changed.add(row.teamId);
    }
    setSnapshot(signature);
    setPreviousRanks(new Map(ranks.map((row) => [row.teamId, row.rank])));
    setFlash(changed);
  }

  useEffect(() => {
    if (flash.size === 0) return;
    const timer = window.setTimeout(() => setFlash(new Set()), 1600);
    return () => window.clearTimeout(timer);
  }, [flash]);

  return flash;
}

export function WeighInStandings({
  initial,
  variant,
  pinnedSessionId = null,
}: {
  initial: WeighInLeaderboard;
  variant: "public" | "tv";
  /** When set, the board stays on this session. Otherwise it follows the open one. */
  pinnedSessionId?: string | null;
}) {
  const board = usePolledBoard(initial, "/api/leaderboard/weigh-in", pinnedSessionId);
  const flash = useRankFlash(board.ranks);

  if (variant === "tv") {
    return <WeighInTv board={board} flash={flash} />;
  }

  return (
    <LeaderboardPublic
      title="Official weigh-in"
      current="weigh-in"
      session={board.session}
      pinnedSessionId={pinnedSessionId}
      footer="AI Brag Board is for fun. These numbers are the official scale."
    >
      {!board.session ? (
        <p className="text-lg">Waiting on the weighmaster to open the scales.</p>
      ) : (
        <>
          <LeaderHero board={board} />
          <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
            <div>
              <RankCards ranks={board.ranks} flash={flash} />
              <div className="hidden overflow-x-auto lg:block">
                <RankTable board={board} flash={flash} tv={false} />
              </div>
            </div>
            <BoardAside board={board} tv={false} />
          </div>
        </>
      )}
    </LeaderboardPublic>
  );
}

function WeighInTv({
  board,
  flash,
}: {
  board: WeighInLeaderboard;
  flash: Set<string>;
}) {
  const clock = useChicagoClock();
  const live = board.session?.status === "OPEN";
  const statusLabel = !board.session ? "Waiting" : live ? "Live" : "Final";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-wave text-paper">
      <header className="flex items-end justify-between gap-6 px-8 pb-3 pt-6">
        <div>
          <p className="font-label text-xl tracking-[0.18em] text-sun">
            {EVENT.shortName} · {statusLabel}
          </p>
          <h1 className="font-display text-5xl leading-none">Official weigh-in</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl tabular-nums">{clock || "—"}</p>
          <p className="text-paper/70">America/Chicago · {EVENT.venue}</p>
        </div>
      </header>

      {!board.session ? (
        <p className="px-8 text-3xl">Waiting on the weighmaster to open the scales.</p>
      ) : (
        <>
          <section className="mx-8 mb-4 grid grid-cols-[1.4fr_0.8fr] gap-6 border-y border-paper/30 py-4">
            <HeroCopy board={board} tv />
          </section>

          <div className="grid min-h-0 flex-1 grid-cols-[1fr_16rem] gap-6 px-8 pb-4">
            <div className="min-h-0 overflow-auto">
              <RankTable board={board} flash={flash} tv />
            </div>
            <BoardAside board={board} tv />
          </div>
        </>
      )}

      <footer className="px-8 pb-5 text-lg text-paper/75">
        AI Brag Board is for fun. These numbers are the official scale. {EVENT.venue}.
      </footer>
    </div>
  );
}

function LeaderHero({ board }: { board: WeighInLeaderboard }) {
  return (
    <section className="double-frame mb-6 grid gap-4 bg-paper p-5 md:grid-cols-[1.4fr_0.8fr] md:p-7">
      <HeroCopy board={board} tv={false} />
    </section>
  );
}

function HeroCopy({ board, tv }: { board: WeighInLeaderboard; tv: boolean }) {
  return (
    <div className="contents">
      <div>
        <p className={`font-label text-sun ${tv ? "text-lg" : "text-sm"}`}>Leader</p>
        <p className={`font-display leading-none ${tv ? "text-7xl" : "text-4xl md:text-6xl"}`}>
          {board.hero?.teamName ?? "Waiting on first fish"}
        </p>
      </div>
      <div className={tv ? "text-right" : ""}>
        <p className={`font-display leading-none text-sun ${tv ? "text-7xl" : "text-4xl md:text-6xl"}`}>
          {board.hero ? formatWeightLbs(board.hero.totalWeightLbs) : "—"}
        </p>
        <p className={tv ? "mt-2 text-2xl text-paper/80" : "mt-1 text-wave/70"}>
          {board.hero?.deltaLbs == null
            ? "No second boat yet"
            : `${formatWeightLbs(board.hero.deltaLbs)} ahead of #2`}
        </p>
      </div>
    </div>
  );
}

function RankCards({
  ranks,
  flash,
}: {
  ranks: WeighInRankRow[];
  flash: Set<string>;
}) {
  if (ranks.length === 0) {
    return <p className="py-6 lg:hidden">Waiting on the first locked stringer.</p>;
  }

  return (
    <ul className="flex flex-col gap-3 lg:hidden" aria-live="polite">
      {ranks.map((row) => (
        <li
          key={row.teamId}
          className={`double-frame bg-paper p-4 ${flash.has(row.teamId) ? "weigh-rank-flash" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-label text-xs text-sun">#{row.rank}</p>
              <p className="font-display text-2xl leading-none break-words">{row.teamName}</p>
              {flash.has(row.teamId) ? <span className="sr-only"> rank changed</span> : null}
            </div>
            <p className="shrink-0 font-display text-2xl text-sun tabular-nums">
              {formatWeightLbs(row.totalWeightLbs)}
            </p>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Slot label="Trout" value={slotWeightText(row.troutLbs, row.troutDq)} />
            <Slot label="Red 1" value={slotWeightText(row.redfishLbs[0], row.redfishDq[0])} />
            <Slot label="Red 2" value={slotWeightText(row.redfishLbs[1], row.redfishDq[1])} />
            <Slot label="Red 3" value={slotWeightText(row.redfishLbs[2], row.redfishDq[2])} />
          </dl>
          <p className="mt-2 text-xs text-wave/60">Locked {formatChicagoTime(row.lockedAt)}</p>
        </li>
      ))}
    </ul>
  );
}

function Slot({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-label text-[0.65rem] tracking-[0.12em] text-wave/50">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function RankTable({
  board,
  flash,
  tv,
}: {
  board: WeighInLeaderboard;
  flash: Set<string>;
  tv: boolean;
}) {
  return (
    <table className={`w-full text-left ${tv ? "text-2xl" : "text-sm md:text-base"}`}>
      <thead className={tv ? "text-paper/70" : "text-wave/60"}>
        <tr className="font-label text-[0.72em] tracking-[0.12em]">
          <th className="py-2 pr-3">#</th>
          <th className="py-2 pr-3">Boat</th>
          <th className="py-2 pr-3">Trout</th>
          <th className="py-2 pr-3">Red 1</th>
          <th className="py-2 pr-3">Red 2</th>
          <th className="py-2 pr-3">Red 3</th>
          <th className="py-2 pr-3">Total</th>
          <th className="py-2">Locked</th>
        </tr>
      </thead>
      <tbody aria-live="polite">
        {board.ranks.map((row) => (
          <tr
            key={row.teamId}
            className={`border-t ${tv ? "border-paper/20" : "border-wave/15"} ${
              flash.has(row.teamId) ? "weigh-rank-flash" : ""
            }`}
          >
            <td className="py-2 pr-3 font-display">{row.rank}</td>
            <td className="py-2 pr-3 font-semibold">
              {row.teamName}
              {flash.has(row.teamId) ? <span className="sr-only"> rank changed</span> : null}
            </td>
            <td className="py-2 pr-3 tabular-nums">{slotWeightText(row.troutLbs, row.troutDq)}</td>
            {row.redfishLbs.map((lbs, index) => (
              <td key={index} className="py-2 pr-3 tabular-nums">
                {slotWeightText(lbs, row.redfishDq[index])}
              </td>
            ))}
            <td className="py-2 pr-3 font-display tabular-nums text-sun">
              {formatWeightLbs(row.totalWeightLbs)}
            </td>
            <td className="py-2 tabular-nums">{formatChicagoTime(row.lockedAt)}</td>
          </tr>
        ))}
        {board.ranks.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-6">
              Waiting on the first locked stringer.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function BoardAside({ board, tv }: { board: WeighInLeaderboard; tv: boolean }) {
  return (
    <aside className={tv ? "min-h-0 overflow-auto text-lg" : "double-frame bg-paper p-5 text-sm"}>
      <h2 className="font-label text-sun">On the scale</h2>
      <NameList names={board.onTheScale} empty="Nobody at the scale" />
      <h2 className="mt-4 font-label text-sun">Boats remaining</h2>
      <NameList names={board.boatsRemaining} empty="Every boat has weighed" />
      {board.disqualified.length ? (
        <>
          <h2 className="mt-4 font-label text-sun">Disqualified</h2>
          <ul>
            {board.disqualified.map((row) => (
              <li key={row.teamId}>
                {row.teamName}
                <span className={tv ? "block text-paper/70" : "block text-wave/60"}>
                  DQ · {row.reason}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </aside>
  );
}

function NameList({ names, empty }: { names: string[]; empty: string }) {
  if (names.length === 0) return <p className="opacity-70">{empty}</p>;
  return (
    <ul>
      {names.map((name) => (
        <li key={name} className="break-words">
          {name}
        </li>
      ))}
    </ul>
  );
}
