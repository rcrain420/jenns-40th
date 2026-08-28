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

export type RosterAnglerDraft = {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
};

type Props = {
  initialAnglers: RosterAnglerDraft[];
  sidePotCount: number;
  paymentStatus: "UNPAID" | "PAID";
  currentDueCents: number;
  canEditRoster: boolean;
  canInvite: boolean;
};

const emptyAngler = (): RosterAnglerDraft => ({
  fullName: "",
  phone: "",
  email: "",
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TeamRosterEditor({
  initialAnglers,
  sidePotCount,
  paymentStatus,
  currentDueCents,
  canEditRoster,
  canInvite,
}: Props) {
  const router = useRouter();
  const [anglers, setAnglers] = useState<RosterAnglerDraft[]>(
    initialAnglers.length ? initialAnglers : [emptyAngler(), emptyAngler()],
  );
  const [saving, setSaving] = useState(false);
  const [invitingIndex, setInvitingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  const nextDue = useMemo(
    () => amountDueCents(anglers.length, sidePotCount),
    [anglers.length, sidePotCount],
  );
  const adding = anglers.length > initialAnglers.length;

  function patchAngler(index: number, next: Partial<RosterAnglerDraft>) {
    setAnglers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...next } : a)),
    );
  }

  async function saveRoster(): Promise<RosterAnglerDraft[] | null> {
    const res = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anglers: anglers.map((a) => ({
          fullName: a.fullName,
          phone: a.phone,
          email: a.email,
        })),
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      team?: { anglers?: RosterAnglerDraft[] };
    };
    if (!res.ok) {
      setError(data.error ?? "Could not save roster");
      return null;
    }
    const next = (data.team?.anglers ?? []).map((a) => ({
      id: a.id,
      fullName: a.fullName,
      phone: a.phone ?? "",
      email: a.email ?? "",
    }));
    setAnglers(next);
    return next;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEditRoster) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    setInviteNote(null);
    try {
      const next = await saveRoster();
      if (next) {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  async function onInvite(index: number) {
    const row = anglers[index];
    const email = row.email.trim();
    if (!EMAIL_RE.test(email)) {
      setError("Add a valid email to send an invite.");
      return;
    }

    setInvitingIndex(index);
    setError(null);
    setSaved(false);
    setInviteNote(null);
    try {
      let anglerId = row.id;
      if (!anglerId) {
        if (!canEditRoster) {
          setError("Save this seat before sending an invite.");
          return;
        }
        const savedRows = await saveRoster();
        anglerId = savedRows?.[index]?.id;
        if (!anglerId) return;
      }

      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anglerId, email }),
      });
      const data = (await res.json()) as { error?: string; email?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send invite");
        return;
      }
      patchAngler(index, { email: data.email ?? email, id: anglerId });
      setInviteNote(`Invite sent to ${data.email ?? email}.`);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setInvitingIndex(null);
    }
  }

  const inputClass =
    "mt-1.5 w-full border border-wave/20 bg-paper px-3 py-2.5 text-ink outline-none ring-sun/30 focus:ring-2 disabled:bg-mist/40";
  const labelClass =
    "block font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80";

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <p className="text-sm text-ink/65">
          Email is optional. Invite sends that person their own magic-link
          invite. Name-only seats stay on the PIN / walk-up path, and the
          shared team link still works as backup.
          {canEditRoster
            ? ` ${MIN_ANGLERS}–${MAX_ANGLERS} fishing anglers. Adding someone updates the amount due.`
            : " Registration is closed, so names stay as they are — you can still add an email and resend Invite."}
        </p>
        {canEditRoster ? (
          <button
            type="button"
            onClick={() => {
              if (anglers.length >= MAX_ANGLERS) return;
              setAnglers((prev) => [...prev, emptyAngler()]);
            }}
            disabled={anglers.length >= MAX_ANGLERS}
            className="shrink-0 text-sm font-semibold text-sea disabled:opacity-40"
          >
            + Add angler
          </button>
        ) : null}
      </div>

      {anglers.map((angler, index) => {
        const emailOk = EMAIL_RE.test(angler.email.trim());
        return (
          <div
            key={angler.id ?? `new-${index}`}
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
                onChange={(e) => patchAngler(index, { fullName: e.target.value })}
                required
                disabled={!canEditRoster}
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
                  patchAngler(index, { phone: formatPhoneInput(e.target.value) })
                }
                disabled={!canEditRoster}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor={`roster-email-${index}`}>
                Email (optional)
              </label>
              <input
                id={`roster-email-${index}`}
                type="email"
                autoComplete="email"
                className={inputClass}
                value={angler.email}
                onChange={(e) => patchAngler(index, { email: e.target.value })}
                placeholder="Leave blank for walk-ups and kids"
                disabled={!canInvite && !canEditRoster}
              />
            </div>
            <div className="flex items-end gap-3">
              {canInvite ? (
                <button
                  type="button"
                  onClick={() => void onInvite(index)}
                  disabled={!emailOk || invitingIndex === index}
                  className="rounded-md bg-wave px-4 py-2 text-sm font-semibold text-salt hover:bg-ink disabled:opacity-40"
                >
                  {invitingIndex === index ? "Sending…" : "Invite"}
                </button>
              ) : null}
              {canEditRoster ? (
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
              ) : null}
            </div>
          </div>
        );
      })}

      {canEditRoster ? (
        <p className="text-ink/75">
          New total: <strong>{formatUsd(nextDue)}</strong>
          {sidePotCount > 0
            ? ` (includes ${sidePotCount} side pot${sidePotCount > 1 ? "s" : ""} at ${formatUsd(SIDE_POT_BUY_IN_CENTS)} each)`
            : ""}
          {paymentStatus === "PAID" && adding
            ? ` — Venmo the extra ${formatUsd(nextDue - currentDueCents)} after you save.`
            : null}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-sea">Roster saved.</p>
      ) : null}
      {inviteNote ? (
        <p className="text-sm text-sea" role="status">
          {inviteNote}
        </p>
      ) : null}

      {canEditRoster ? (
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-wave px-5 py-3 font-semibold text-salt hover:bg-ink disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save roster"}
        </button>
      ) : null}
    </form>
  );
}
