"use client";

import { useEffect, useId, useState } from "react";
import { LIVEWELL_PLUS_LOCKED } from "@/lib/livewell-plus";

export function AddCatchFab({
  active,
  onAdd,
}: {
  /** When true, + opens the upload flow. When false, + explains the wait. */
  active: boolean;
  onAdd: () => void;
}) {
  const dialogId = useId();
  const [lockedOpen, setLockedOpen] = useState(false);

  useEffect(() => {
    if (!lockedOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLockedOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lockedOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (active) {
            onAdd();
            return;
          }
          setLockedOpen(true);
        }}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sun text-3xl font-semibold leading-none text-paper shadow-[0_10px_28px_rgba(22,53,79,0.28)] transition hover:bg-sun-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper md:bottom-8 md:right-8"
        aria-label={active ? "Add a catch" : "When you can add a catch"}
        aria-haspopup={active ? undefined : "dialog"}
        aria-expanded={active ? undefined : lockedOpen}
        aria-controls={active ? undefined : dialogId}
      >
        <span aria-hidden>+</span>
      </button>

      {lockedOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-wave/40 p-4 md:items-center"
          onClick={() => setLockedOpen(false)}
        >
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            className="w-full max-w-md rounded-xl bg-paper px-5 py-6 text-ink shadow-[0_18px_40px_rgba(26,36,48,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={`${dialogId}-title`}
              className="font-display text-2xl uppercase tracking-[0.04em] text-wave"
            >
              {LIVEWELL_PLUS_LOCKED.title}
            </h2>
            <p className="mt-3 text-ink/75">{LIVEWELL_PLUS_LOCKED.body}</p>
            <button
              type="button"
              onClick={() => setLockedOpen(false)}
              className="mt-5 inline-flex items-center justify-center rounded-md bg-wave px-4 py-2.5 text-sm font-semibold text-paper hover:bg-wave-pressed"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
