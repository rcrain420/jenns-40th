"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

type UnlockState = "loading" | "locked" | "unlocked" | "unconfigured";

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function EventPinGate({
  children,
  title = "Unlock required",
  description = "Use the link from your registration email, or enter the event PIN.",
}: Props) {
  const [state, setState] = useState<UnlockState>("loading");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/event-unlock")
      .then((res) => res.json())
      .then((data: { unlocked?: boolean; configured?: boolean }) => {
        if (cancelled) return;
        if (!data.configured) {
          setState(
            process.env.NODE_ENV === "production" ? "unconfigured" : "unlocked",
          );
          return;
        }
        setState(data.unlocked ? "unlocked" : "locked");
      })
      .catch(() => {
        if (!cancelled) setState("locked");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onUnlock() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/event-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Incorrect PIN");
        return;
      }
      setPin("");
      setState("unlocked");
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "loading") {
    return (
      <p className="text-sm text-ink/50" aria-live="polite">
        Checking access…
      </p>
    );
  }

  if (state === "unconfigured") {
    return (
      <p className="text-sm text-alert" role="alert">
        Catch logging isn&apos;t available yet. Check back shortly, or ask an
        organizer.
      </p>
    );
  }

  if (state === "locked") {
    return (
      <div className="space-y-3 rounded-md border border-[var(--line)] bg-salt/60 p-4">
        <div>
          <p className="font-semibold text-wave">{title}</p>
          <p className="mt-1 text-sm text-ink/70">{description}</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void onUnlock();
            }
          }}
          placeholder="Event PIN"
          className="w-full rounded-md border border-[var(--line)] bg-salt px-3 py-2 text-sm outline-none focus:border-sea"
          aria-label="Event PIN"
        />
        {error && (
          <p className="text-xs text-alert" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void onUnlock()}
          disabled={submitting || !pin.trim()}
          className="rounded-md bg-wave px-3 py-1.5 text-sm font-semibold text-salt hover:bg-ink disabled:opacity-60"
        >
          {submitting ? "Unlocking…" : "Unlock"}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
