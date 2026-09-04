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
import {
  YOUTH_ATTESTATION_ERROR,
  YOUTH_ATTESTATION_LABEL,
  YOUTH_CHECKBOX_LABEL,
  YOUTH_EMAIL_HELPER,
  hasYouthAngler,
} from "@/lib/youth";

export type RosterAnglerDraft = {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  isYouth: boolean;
};

type Props = {
  initialAnglers: RosterAnglerDraft[];
  sidePotCount: number;
  paymentStatus: "UNPAID" | "PAID";
  currentDueCents: number;
  canEditRoster: boolean;
  canInvite: boolean;
  defaultNewIsYouth?: boolean;
};

const emptyAngler = (isYouth = false): RosterAnglerDraft => ({
  fullName: "",
  phone: "",
  email: "",
  isYouth,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TeamRosterEditor({
  initialAnglers,
  sidePotCount,
  paymentStatus,
  currentDueCents,
  canEditRoster,
  canInvite,
  defaultNewIsYouth = false,
}: Props) {
  const router = useRouter();
  const [anglers, setAnglers] = useState<RosterAnglerDraft[]>(initialAnglers);
  const [youthGuardianAttested, setYouthGuardianAttested] = useState(
    hasYouthAngler(initialAnglers),
  );
  const [addingCount, setAddingCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [invitingIndex, setInvitingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  const nextDue = useMemo(
    () => amountDueCents(anglers, sidePotCount),
    [anglers, sidePotCount],
  );
  const extraDue = nextDue - currentDueCents;

  function patchAngler(index: number, next: Partial<RosterAnglerDraft>) {
    setAnglers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...next } : a)),
    );
  }

  function addAngler() {
    if (anglers.length >= MAX_ANGLERS) return;
    setAnglers((prev) => [...prev, emptyAngler(defaultNewIsYouth)]);
    setAddingCount((count) => count + 1);
    setSaved(false);
    setInviteNote(null);
  }

  function removeAngler(index: number) {
    const row = anglers[index];
    if (row?.id && anglers.filter((a) => a.id).length <= MIN_ANGLERS) {
      setError(`Keep at least ${MIN_ANGLERS} fishing anglers on the roster.`);
      return;
    }
    setAnglers((prev) => prev.filter((_, i) => i !== index));
    if (!row?.id) {
      setAddingCount((count) => Math.max(0, count - 1));
    }
  }

  async function saveRoster(): Promise<RosterAnglerDraft[] | null> {
    const named = anglers.filter((a) => a.fullName.trim());
    const res = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anglers: named.map((a) => ({
          fullName: a.fullName,
          phone: a.phone,
          email: a.email,
          isYouth: a.isYouth,
        })),
        youthGuardianAttested,
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
      isYouth: a.isYouth === true,
    }));
    setAnglers(next);
    setAddingCount(0);
    return next;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEditRoster) return;
    if (hasYouthAngler(anglers) && !youthGuardianAttested) {
      setError(YOUTH_ATTESTATION_ERROR);
      return;
    }
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
    if (row.isYouth) {
      setError(
        "Youth anglers do not get a Join the boat / create-account invite. Parent login is the login.",
      );
      return;
    }
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
          Email is optional. {YOUTH_EMAIL_HELPER} Invite on an adult seat
          sends Join the boat. Youth seats do not get a create-account invite
          — parent login is the login — and they do not add to the $75 entry
          total. Adults without email can stay name-only on the PIN /
          shared-link path. That is not the kids path.
          {canEditRoster
            ? ` ${MIN_ANGLERS}–${MAX_ANGLERS} fishing anglers, including kids. Use + Add angler to add a seat — the add form stays hidden until you click it.`
            : " Registration is closed, so names stay as they are — you can still add an email and resend Invite on adult seats."}
        </p>
        {canEditRoster ? (
          <button
            type="button"
            onClick={addAngler}
            disabled={anglers.length >= MAX_ANGLERS}
            className="shrink-0 text-sm font-semibold text-sea disabled:opacity-40"
          >
            + Add angler
          </button>
        ) : null}
      </div>

      {anglers.length === 0 ? (
        <p className="text-sm text-ink/60">
          No extra seats yet. Click + Add angler to add someone to the paid
          roster.
        </p>
      ) : null}

      {anglers.map((angler, index) => {
        const emailOk = EMAIL_RE.test(angler.email.trim());
        const isDraft = !angler.id;
        if (!isDraft) {
          return (
            <div
              key={angler.id ?? `saved-${index}`}
              className="flex flex-col gap-3 border border-wave/15 bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-wave">
                  {angler.fullName}
                  {angler.isYouth ? (
                    <span className="ml-2 inline-block rounded-full bg-sun/20 px-2 py-0.5 font-label text-[0.7rem] uppercase tracking-[0.1em] text-wave">
                      Youth
                    </span>
                  ) : null}
                </p>
                {canEditRoster ? (
                  <label className="mt-2 flex items-center gap-2 text-sm text-ink/70">
                    <input
                      type="checkbox"
                      checked={angler.isYouth}
                      onChange={(e) =>
                        patchAngler(index, { isYouth: e.target.checked })
                      }
                      className="h-4 w-4 accent-sea"
                    />
                    {YOUTH_CHECKBOX_LABEL}
                  </label>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
                {canInvite && !angler.isYouth ? (
                  <input
                    id={`roster-email-${index}`}
                    type="email"
                    autoComplete="email"
                    className="w-full border border-wave/20 bg-paper px-3 py-2 text-ink outline-none ring-sun/30 focus:ring-2"
                    value={angler.email}
                    onChange={(e) => patchAngler(index, { email: e.target.value })}
                    placeholder="Email to invite (optional)"
                    aria-label={`Email for ${angler.fullName}`}
                  />
                ) : null}
                <div className="flex items-center gap-3">
                  {canInvite && !angler.isYouth ? (
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
                      onClick={() => removeAngler(index)}
                      className="text-sm text-alert"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={`new-${index}`}
            className="grid gap-3 border border-wave/15 bg-paper p-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label className={labelClass} htmlFor={`roster-name-${index}`}>
                New angler
              </label>
              <input
                id={`roster-name-${index}`}
                className={inputClass}
                value={angler.fullName}
                onChange={(e) => patchAngler(index, { fullName: e.target.value })}
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
                  patchAngler(index, { phone: formatPhoneInput(e.target.value) })
                }
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
                placeholder="Parent email is fine — kids do not need an account"
              />
              <p className="mt-1 text-sm text-ink/60">{YOUTH_EMAIL_HELPER}</p>
            </div>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={angler.isYouth}
                onChange={(e) =>
                  patchAngler(index, { isYouth: e.target.checked })
                }
                className="h-4 w-4 accent-sea"
              />
              <span className="text-sm">{YOUTH_CHECKBOX_LABEL}</span>
            </label>
            <div className="flex items-end gap-3">
              {canInvite && !angler.isYouth ? (
                <button
                  type="button"
                  onClick={() => void onInvite(index)}
                  disabled={!emailOk || invitingIndex === index}
                  className="rounded-md bg-wave px-4 py-2 text-sm font-semibold text-salt hover:bg-ink disabled:opacity-40"
                >
                  {invitingIndex === index ? "Sending…" : "Invite"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => removeAngler(index)}
                className="pb-2.5 text-sm text-alert"
              >
                Cancel
              </button>
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
          {paymentStatus === "PAID" && extraDue > 0
            ? ` — Venmo the extra ${formatUsd(extraDue)} after you save.`
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

      {canEditRoster && hasYouthAngler(anglers) ? (
        <label className="flex items-start gap-3 border border-wave/15 bg-mist/70 px-4 py-3">
          <input
            type="checkbox"
            checked={youthGuardianAttested}
            onChange={(e) => setYouthGuardianAttested(e.target.checked)}
            className="mt-1 h-4 w-4 accent-sea"
          />
          <span className="text-sm leading-relaxed">
            {YOUTH_ATTESTATION_LABEL} <span className="text-alert">*</span>
          </span>
        </label>
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
