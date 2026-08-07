"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type AppNotification = {
  id: string;
  type: "catch";
  title: string;
  body: string;
  href: string;
  createdAt: string;
};

const SEEN_KEY = "bay-bash-alerts-seen-at";
const POLL_MS = 12_000;

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function readSeenAt(): string {
  if (typeof window === "undefined") return new Date(0).toISOString();
  return localStorage.getItem(SEEN_KEY) ?? new Date(0).toISOString();
}

function writeSeenAt(iso: string) {
  localStorage.setItem(SEEN_KEY, iso);
}

export function NotificationBell({
  tone = "light",
}: {
  tone?: "light" | "invert";
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [seenAt, setSeenAt] = useState<string>(new Date(0).toISOString());
  const [ready, setReady] = useState(false);

  const invert = tone === "invert";
  const unread = items.filter((n) => n.createdAt > seenAt).length;

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=25");
      if (!res.ok) return;
      const data = (await res.json()) as { notifications?: AppNotification[] };
      setItems(data.notifications ?? []);
    } catch {
      // ignore poll blips
    }
  }, []);

  useEffect(() => {
    setSeenAt(readSeenAt());
    setReady(true);
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function markAllSeen() {
    const latest = items[0]?.createdAt ?? new Date().toISOString();
    writeSeenAt(latest);
    setSeenAt(latest);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) markAllSeen();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
          invert
            ? "border-paper/35 text-paper hover:bg-paper/10"
            : "border-wave/25 text-wave hover:bg-wave/5"
        }`}
        aria-label={
          unread > 0
            ? `Catch alerts, ${unread} unread`
            : "Catch alerts"
        }
        aria-expanded={open}
        aria-controls={panelId}
      >
        <BellIcon />
        {ready && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sun px-1 text-[0.65rem] font-bold text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Catch alerts"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-wave/15 bg-paper text-ink shadow-[0_18px_40px_rgba(26,36,48,0.18)]"
        >
          <div className="border-b border-wave/10 bg-mist/60 px-3 py-2.5">
            <p className="font-display text-xs uppercase tracking-[0.14em] text-wave">
              Catch alerts
            </p>
            <p className="mt-1 text-xs text-ink/60">
              Fun fleet buzz — AI guesses don&apos;t count at weigh-in.
            </p>
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-ink/55">
              No catches yet. First photo on the board rings the bell.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-wave/10 last:border-0">
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-3 transition hover:bg-mist/70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-wave">{n.title}</p>
                      <time
                        dateTime={n.createdAt}
                        className="shrink-0 text-[0.7rem] text-ink/45"
                      >
                        {formatWhen(n.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-ink/75">
                      {n.body}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-wave/10 px-3 py-2.5">
            <Link
              href="/catches"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold uppercase tracking-[0.12em] text-sea hover:underline"
            >
              Open Livewell →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
