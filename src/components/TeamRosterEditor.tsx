"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  amountDueCents,
  MAX_ANGLERS,
  MIN_ANGLERS,
  SIDE_POT_BUY_IN_CENTS,
} from "@/lib/config";
import { formatUsd } from "@/lib/money";
import { formatPhoneInput } from "@/lib/phone";

type AnglerDraft = { fullName: string; phone: string };

type Props = {
  initialAnglers: AnglerDraft[];
  sidePotCount: number;
  paymentStatus: "UNPAID" | "PAID";
  currentDueCents: number;
};

const emptyAngler = (): AnglerDraft => ({ fullName: "", phone: "" });

export function TeamRosterEditor({
  initialAnglers,
  sidePotCount,
  paymentStatus,
  currentDueCents,
}: Props) {
  const router = useRouter();
  const [anglers, setAnglers] = useState<AnglerDraft[]>(
    initialAnglers.length ? initialAnglers : [emptyAngler(), emptyAngler()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const nextDue = useMemo(
    () => amountDueCents(anglers.length, sidePotCount),
    [anglers.length, sidePotCount],
  );
  const adding = anglers.length > initialAnglers.length;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anglers }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save roster");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full border border-wave/20 bg-paper px-3 py-2.5 text-ink outline-none ring-sun/30 focus:ring-2";
  const labelClass =
    "block font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80";

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <p className="text-sm text-ink/65">
          {MIN_ANGLERS}–{MAX_ANGLERS} fishing anglers. Adding someone updates
          the amount due.
        </p>
        <button
          type="button"
          onClick={() => {
            if (anglers.length >= MAX_ANGLERS) return;
            setAnglers((prev) => [...prev, emptyAngler()]);
          }}
          disabled={anglers.length >= MAX_ANGLERS}
          className="text-sm font-semibold text-sea disabled:opacity-40"
        >
          + Add angler
        </button>
      </div>

      {anglers.map((angler, index) => (
        <div
          key={index}
          className="grid gap-3 border border-wave/15 bg-paper p-4 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className={labelClass} htmlFor={`roster-name-${index}`}>
              Angler {index + 1}
            </label>
            <input
              id={`roster-name-${index}`}
              className={inputClass}
              value={angler.fullName}
              onChange={(e) =>
                setAnglers((prev) =>
                  prev.map((a, i) =>
                    i === index ? { ...a, fullName: e.target.value } : a,
                  ),
                )
              }
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`roster-phone-${index}`}>
              Phone (optional)
            </label>
            <input
              id={`roster-phone-${index}`}
              type="tel"
              inputMode="numeric"
              className={inputClass}
              value={angler.phone}
              maxLength={14}
              onChange={(e) =>
                setAnglers((prev) =>
                  prev.map((a, i) =>
                    i === index
                      ? { ...a, phone: formatPhoneInput(e.target.value) }
                      : a,
                  ),
                )
              }
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() =>
                setAnglers((prev) => prev.filter((_, i) => i !== index))
              }
              disabled={anglers.length <= MIN_ANGLERS}
              className="pb-2.5 text-sm text-alert disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <p className="text-ink/75">
        New total: <strong>{formatUsd(nextDue)}</strong>
        {sidePotCount > 0
          ? ` (includes ${sidePotCount} side pot${sidePotCount > 1 ? "s" : ""} at ${formatUsd(SIDE_POT_BUY_IN_CENTS)} each)`
          : ""}
        {paymentStatus === "PAID" && adding
          ? ` — Venmo the extra ${formatUsd(nextDue - currentDueCents)} after you save.`
          : null}
      </p>

      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-sea">Roster saved.</p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-wave px-5 py-3 font-semibold text-salt hover:bg-ink disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save roster"}
      </button>
    </form>
  );
}
