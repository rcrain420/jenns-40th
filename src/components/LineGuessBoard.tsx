"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  lineGuessEntryItemPath,
  lineGuessPinPath,
} from "@/lib/line-guess-format";

export type LineGuessBoardEntry = {
  id: string;
  name: string;
  guessLabel: string;
  paidClaimed: boolean;
  method: string;
  note: string | null;
  createdLabel: string;
};

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || "Something went wrong";
  } catch {
    return "Something went wrong";
  }
}

export function LineGuessBoard({
  token,
  entries,
}: {
  token: string;
  entries: LineGuessBoardEntry[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const paidCount = entries.filter((entry) => entry.paidClaimed).length;
  const countLabel = entries.length === 1 ? "1 guess" : `${entries.length} guesses`;

  async function togglePaid(entry: LineGuessBoardEntry) {
    if (pendingId) return;
    setError(null);
    setPendingId(entry.id);
    try {
      const res = await fetch(lineGuessEntryItemPath(token, entry.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidClaimed: !entry.paidClaimed }),
      });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      await router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(entry: LineGuessBoardEntry) {
    if (pendingId) return;
    const confirmed = window.confirm(`Delete the guess from ${entry.name}?`);
    if (!confirmed) return;
    setError(null);
    setPendingId(entry.id);
    try {
      const res = await fetch(lineGuessEntryItemPath(token, entry.id), {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      await router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPendingId(null);
    }
  }

  async function lock() {
    if (locking) return;
    if (!window.confirm("Lock the tracker?")) return;
    setLocking(true);
    try {
      await fetch(lineGuessPinPath(token), { method: "DELETE" });
      router.refresh();
    } catch {
      setError("Could not lock the tracker.");
      setLocking(false);
    }
  }

  return (
    <div className="print:hidden">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink/70">
          {countLabel} · {paidCount} paid claimed
        </p>
        <button
          type="button"
          onClick={() => void lock()}
          disabled={locking}
          className="font-label text-xs tracking-[0.12em] text-ink/60 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {locking ? "Locking…" : "Lock"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-alert">
          {error}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-6 text-ink/70">No guesses yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-[var(--line)] bg-white px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-display text-2xl text-wave">
                    {entry.name}
                  </p>
                  <p className="mt-1 text-lg text-ink">{entry.guessLabel}</p>
                  <p className="mt-1 text-sm text-ink/55">{entry.createdLabel}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={
                      entry.paidClaimed
                        ? "rounded-full bg-foam/30 px-2 py-1 text-xs font-semibold text-wave"
                        : "rounded-full bg-alert/15 px-2 py-1 text-xs font-semibold text-alert"
                    }
                  >
                    {entry.paidClaimed ? "Paid claimed" : "Unpaid"}
                  </p>
                  <p className="mt-1 text-xs text-ink/45">{entry.method}</p>
                </div>
              </div>
              {entry.note ? (
                <p className="mt-2 break-words text-sm text-ink/70">{entry.note}</p>
              ) : null}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void togglePaid(entry)}
                  disabled={pendingId !== null}
                  className="btn-bay btn-bay-outline min-h-11 w-full px-3 py-2 text-sm sm:flex-1"
                >
                  {entry.paidClaimed ? "Flag unpaid" : "Mark paid"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(entry)}
                  disabled={pendingId !== null}
                  className="btn-bay min-h-11 w-full border-2 border-alert px-[calc(0.75rem-2px)] py-[calc(0.5rem-2px)] text-sm text-alert sm:w-auto"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
