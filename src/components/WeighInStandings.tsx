"use client";

import { useEffect, useState } from "react";
import { useChicagoClock, usePolledBoard } from "@/components/usePolledBoard";
import { EVENT } from "@/lib/config";
import { formatChicagoTime, formatWeightLbs } from "@/lib/weigh-scoring";
import { slotWeightText, type WeighInLeaderboard } from "@/lib/weigh-board";

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
  const clock = useChicagoClock();
  const flash = useRankFlash(board.ranks);
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
      <header className={tv ? "flex items-end justify-between gap-6 px-8 pb-3 pt-6" : "mb-6"}>
        <div>
          <p className={`font-label text-sun ${tv ? "text-xl tracking-[0.18em]" : "text-sm tracking-[0.16em]"}`}>
            {EVENT.shortName} · {live ? "Live" : "Final"}
          </p>
          <h1 className={`font-display leading-none ${tv ? "text-5xl" : "text-4xl md:text-5xl"}`}>
            Official weigh-in
          </h1>
        </div>
        <div className={tv ? "text-right" : "mt-3 text-sm text-wave/70"}>
          <p className={tv ? "font-display text-4xl tabular-nums" : "font-label tracking-[0.12em]"}>
            {clock || "—"}
          </p>
          <p className={tv ? "text-paper/70" : ""}>America/Chicago · {EVENT.venue}</p>
        </div>
      </header>

      {!board.session ? (
        <p className={tv ? "px-8 text-3xl" : "text-lg"}>Waiting on the weighmaster to open the scales.</p>
      ) : (
        <>
          <section
            className={
              tv
                ? "mx-8 mb-4 grid grid-cols-[1.4fr_0.8fr] gap-6 border-y border-paper/30 py-4"
                : "double-frame mb-6 grid gap-4 bg-paper p-5 md:grid-cols-[1.4fr_0.8fr] md:p-7"
            }
          >
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
          </section>

          <div className={tv ? "grid min-h-0 flex-1 grid-cols-[1fr_16rem] gap-6 px-8 pb-4" : "grid gap-6 lg:grid-cols-[1fr_16rem]"}>
            <div className={tv ? "min-h-0 overflow-auto" : "overflow-x-auto"}>
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
                <tbody>
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
            </div>

            <aside className={tv ? "min-h-0 overflow-auto text-lg" : "text-sm"}>
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
          </div>
        </>
      )}

      <footer className={tv ? "px-8 pb-5 text-lg text-paper/75" : "mt-8 text-sm text-wave/60"}>
        AI Brag Board is for fun. These numbers are the official scale. {EVENT.venue}.
      </footer>
    </div>
  );
}

function NameList({ names, empty }: { names: string[]; empty: string }) {
  if (names.length === 0) return <p className="opacity-70">{empty}</p>;
  return (
    <ul>
      {names.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}
