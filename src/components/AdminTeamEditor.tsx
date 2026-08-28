"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  amountDueCents,
  MAX_ANGLERS,
  MIN_ANGLERS,
  PAID_SIDE_POTS,
  SIDE_POT_BUY_IN_CENTS,
  type SidePotId,
} from "@/lib/config";
import { formatUsd } from "@/lib/money";

type AnglerDraft = { fullName: string; phone: string; email: string };
type BoatType = "GUIDED" | "NON_GUIDED";

type Props = {
  mode: "create" | "edit";
  teamId?: string;
  initial?: {
    teamName: string;
    boatType: BoatType;
    captainName: string;
    captainPhone: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    registrantEmail: string;
    notes: string;
    licenseConfirmed: boolean;
    paymentStatus: "UNPAID" | "PAID";
    anglers: AnglerDraft[];
    sidePots: SidePotId[];
  };
};

const emptyAngler = (): AnglerDraft => ({ fullName: "", phone: "", email: "" });

export function AdminTeamEditor({ mode, teamId, initial }: Props) {
  const router = useRouter();
  const [teamName, setTeamName] = useState(initial?.teamName ?? "");
  const [boatType, setBoatType] = useState<BoatType>(
    initial?.boatType ?? "GUIDED",
  );
  const [captainName, setCaptainName] = useState(initial?.captainName ?? "");
  const [captainPhone, setCaptainPhone] = useState(initial?.captainPhone ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? "");
  const [registrantEmail, setRegistrantEmail] = useState(
    initial?.registrantEmail ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [licenseConfirmed, setLicenseConfirmed] = useState(
    initial?.licenseConfirmed ?? true,
  );
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID">(
    initial?.paymentStatus ?? "UNPAID",
  );
  const [anglers, setAnglers] = useState<AnglerDraft[]>(
    initial?.anglers?.length
      ? initial.anglers
      : [emptyAngler(), emptyAngler()],
  );
  const [sidePots, setSidePots] = useState<SidePotId[]>(
    initial?.sidePots ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 outline-none ring-foam/40 focus:ring-2";
  const labelClass = "block text-sm font-medium text-ink/80";

  function payload() {
    return {
      teamName,
      boatType,
      captainName,
      captainPhone,
      contactName,
      contactPhone,
      contactEmail,
      registrantEmail,
      notes,
      licenseConfirmed,
      paymentStatus,
      anglers,
      sidePots,
    };
  }

  function toggleSidePot(id: SidePotId) {
    setSidePots((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url =
        mode === "create" ? "/api/admin/teams" : `/api/admin/teams/${teamId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!teamId) return;
    if (!confirm("Delete this team registration?")) return;
    const res = await fetch(`/api/admin/teams/${teamId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Team name</label>
          <input
            className={inputClass}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Boat type</label>
          <select
            className={inputClass}
            value={boatType}
            onChange={(e) => setBoatType(e.target.value as BoatType)}
          >
            <option value="GUIDED">Guided</option>
            <option value="NON_GUIDED">Non-guided</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Payment status</label>
          <select
            className={inputClass}
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as "UNPAID" | "PAID")
            }
          >
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {boatType === "GUIDED" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Captain name</label>
            <input
              className={inputClass}
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Captain phone</label>
            <input
              className={inputClass}
              value={captainPhone}
              onChange={(e) => setCaptainPhone(e.target.value)}
              required
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Primary contact name</label>
            <input
              className={inputClass}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Primary contact phone</label>
            <input
              className={inputClass}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Primary contact email</label>
            <input
              type="email"
              className={inputClass}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Registrant email</label>
        <input
          type="email"
          className={inputClass}
          value={registrantEmail}
          onChange={(e) => setRegistrantEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-wave">Anglers</h3>
          <button
            type="button"
            disabled={anglers.length >= MAX_ANGLERS}
            onClick={() => setAnglers((a) => [...a, emptyAngler()])}
            className="text-sm font-semibold text-sea disabled:opacity-40"
          >
            + Add
          </button>
        </div>
        {anglers.map((angler, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              className={inputClass}
              placeholder={`Angler ${index + 1} name`}
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
            <input
              type="email"
              className={inputClass}
              placeholder="Email (optional)"
              value={angler.email}
              onChange={(e) =>
                setAnglers((prev) =>
                  prev.map((a, i) =>
                    i === index ? { ...a, email: e.target.value } : a,
                  ),
                )
              }
            />
            <input
              className={inputClass}
              placeholder="Phone (optional)"
              value={angler.phone}
              onChange={(e) =>
                setAnglers((prev) =>
                  prev.map((a, i) =>
                    i === index ? { ...a, phone: e.target.value } : a,
                  ),
                )
              }
            />
            <button
              type="button"
              disabled={anglers.length <= MIN_ANGLERS}
              onClick={() =>
                setAnglers((prev) => prev.filter((_, i) => i !== index))
              }
              className="text-sm text-alert disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-xl text-wave">Side pots</h3>
        <p className="text-sm text-ink/60">
          {formatUsd(SIDE_POT_BUY_IN_CENTS)} per team, per pot.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PAID_SIDE_POTS.map((pot) => (
            <label
              key={pot.id}
              className="flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={sidePots.includes(pot.id)}
                onChange={() => toggleSidePot(pot.id)}
                className="accent-sea"
              />
              {pot.name}
            </label>
          ))}
        </div>
        <p className="text-sm text-ink/60">
          Due: {formatUsd(amountDueCents(anglers.length, sidePots.length))}
        </p>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={`${inputClass} min-h-24`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={licenseConfirmed}
          onChange={(e) => setLicenseConfirmed(e.target.checked)}
          className="accent-sea"
        />
        License confirmed
      </label>

      {error && <p className="text-sm text-alert">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-wave px-5 py-2.5 font-semibold text-salt hover:bg-ink disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Create team" : "Save changes"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md px-5 py-2.5 text-alert hover:bg-alert/10"
          >
            Delete team
          </button>
        )}
      </div>
    </form>
  );
}
