"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useChicagoClock } from "@/components/usePolledBoard";
import { EVENT } from "@/lib/config";
import type { BoardSession } from "@/lib/weigh-board";

export function sessionBoardState(session: BoardSession | null) {
  if (!session) {
    return {
      live: false,
      label: "Waiting",
      detail: "The weighmaster has not opened the scales yet.",
    };
  }
  if (session.status === "OPEN") {
    return {
      live: true,
      label: "Live",
      detail: "Ranks refresh every few seconds while the scales are open.",
    };
  }
  return {
    live: false,
    label: "Final",
    detail: "This session is closed. These are the official ranks.",
  };
}

export function LeaderboardPublic({
  title,
  current,
  session,
  pinnedSessionId = null,
  children,
  footer,
}: {
  title: string;
  current: "weigh-in" | "side-pots";
  session: BoardSession | null;
  pinnedSessionId?: string | null;
  children: ReactNode;
  footer: string;
}) {
  const clock = useChicagoClock();
  const state = sessionBoardState(session);
  const query = pinnedSessionId
    ? `?session=${encodeURIComponent(pinnedSessionId)}`
    : "";

  return (
    <div className="text-wave">
      <div className="bg-wave pb-8 pt-8 text-paper md:pb-10 md:pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-end md:justify-between md:px-11">
          <div className="max-w-xl">
            <p className="font-label text-sm tracking-[0.18em] text-paper/70">
              {EVENT.shortName} · Official scale
            </p>
            <h1 className="mt-2 font-display text-4xl leading-none md:text-5xl">{title}</h1>
            <p className="mt-3 text-paper/85">{state.detail}</p>
            {session?.label ? (
              <p className="mt-2 font-label text-xs tracking-[0.12em] text-paper/60">
                {session.label}
              </p>
            ) : null}
            <nav className="mt-5 flex flex-wrap gap-2" aria-label="Official boards">
              <BoardLink
                href={`/leaderboard/weigh-in${query}`}
                current={current === "weigh-in"}
              >
                Weigh-in
              </BoardLink>
              <BoardLink
                href={`/leaderboard/side-pots${query}`}
                current={current === "side-pots"}
              >
                Side pots
              </BoardLink>
            </nav>
          </div>
          <div className="shrink-0 md:text-right">
            <p className="inline-flex items-center gap-2 font-label text-sm tracking-[0.14em] text-paper">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  state.live ? "animate-pulse bg-sun" : "bg-paper/45"
                }`}
                aria-hidden
              />
              {state.label}
            </p>
            <p className="mt-2 font-display text-3xl tabular-nums md:text-4xl">
              {clock || "—"}
            </p>
            <p className="text-sm text-paper/70">America/Chicago</p>
            <p className="text-sm text-paper/70">{EVENT.venue}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-11 md:py-11">
        {children}
        <p className="mt-8 text-sm text-wave/60">
          {footer} {EVENT.venue}.
        </p>
      </div>
    </div>
  );
}

function BoardLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "btn-bay btn-bay-red"
          : "btn-bay border-2 border-paper/50 px-[calc(1.75rem-2px)] py-[calc(0.9rem-2px)] text-paper hover:bg-paper/10"
      }
    >
      {children}
    </Link>
  );
}
