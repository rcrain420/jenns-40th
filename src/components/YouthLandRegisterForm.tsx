"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ENTRY_KIND,
  MAX_YOUTH_ANGLERS,
  MIN_YOUTH_ANGLERS,
  YOUTH_TOURNAMENT,
} from "@/lib/config";
import { formatPhoneInput } from "@/lib/phone";
import { canAddYouthSeat } from "@/lib/roster-capacity";
import type { PublicUser } from "@/lib/users";
import {
  LICENSE_CONFIRM_ERROR,
  LICENSE_CONFIRM_LABEL,
  YOUTH_ATTESTATION_ERROR,
  YOUTH_ATTESTATION_LABEL,
  YOUTH_EMAIL_HELPER,
} from "@/lib/youth";
import {
  publicRegistrationClosedCopy,
} from "@/lib/registration-policy";
import { SHIRT_SIZE_REQUIRED_ERROR, isShirtSize } from "@/lib/shirt-size";
import { ShirtSizeSelect } from "./ShirtSizeSelect";

type YouthDraft = {
  fullName: string;
  phone: string;
  email: string;
  shirtSize: string;
};

const emptyYouth = (): YouthDraft => ({
  fullName: "",
  phone: "",
  email: "",
  shirtSize: "",
});

type FieldErrors = Record<string, string[] | undefined>;

type Props = {
  registrationOpen: boolean;
  viewer?: PublicUser | null;
};

export function YouthLandRegisterForm({
  registrationOpen,
  viewer = null,
}: Props) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [registrantEmail, setRegistrantEmail] = useState(viewer?.email ?? "");
  const [notes, setNotes] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [youthGuardianAttested, setYouthGuardianAttested] = useState(false);
  const [kids, setKids] = useState<YouthDraft[]>([emptyYouth()]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const canAdd = canAddYouthSeat(
    kids.map(() => ({ isYouth: true })),
    ENTRY_KIND.YOUTH_LAND,
  );

  function updateKid(index: number, patch: Partial<YouthDraft>) {
    setKids((prev) => prev.map((kid, i) => (i === index ? { ...kid, ...patch } : kid)));
  }

  function err(key: string) {
    const messages = fieldErrors[key];
    if (!messages?.length) return null;
    return (
      <p id={`${key}-error`} className="mt-1 text-sm text-alert" role="alert">
        {messages[0]}
      </p>
    );
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!teamName.trim()) next.teamName = ["A household or kids name is required"];
    if (!registrantEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrantEmail.trim())) {
      next.registrantEmail = ["Valid email required"];
    }
    const named = kids.filter((kid) => kid.fullName.trim());
    if (named.length < MIN_YOUTH_ANGLERS) {
      next.anglers = [`Add at least ${MIN_YOUTH_ANGLERS} youth angler.`];
    }
    kids.forEach((kid, index) => {
      if (kid.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kid.email.trim())) {
        next[`angler-email-${index}`] = ["Valid email required"];
      }
      if (kid.fullName.trim() && !isShirtSize(kid.shirtSize)) {
        next[`angler-shirt-${index}`] = [SHIRT_SIZE_REQUIRED_ERROR];
      }
    });
    if (!youthGuardianAttested) {
      next.youthGuardianAttested = [YOUTH_ATTESTATION_ERROR];
    }
    if (!licenseConfirmed) {
      next.licenseConfirmed = [LICENSE_CONFIRM_ERROR];
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryKind: ENTRY_KIND.YOUTH_LAND,
          teamName,
          registrantEmail,
          notes,
          licenseConfirmed: true,
          youthGuardianAttested: true,
          anglers: kids
            .filter((kid) => kid.fullName.trim())
            .map((kid) => ({
              fullName: kid.fullName,
              phone: kid.phone,
              email: kid.email,
              shirtSize: kid.shirtSize,
              isYouth: true,
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Registration failed");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }
      const mail = data.confirmationEmailSent ? "sent" : "failed";
      router.push(`/register/success?team=${data.team.id}&mail=${mail}`);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!registrationOpen) {
    const closed = publicRegistrationClosedCopy({
      openByDate: false,
      openByCapacity: true,
    });
    return (
      <div className="border border-dashed border-wave/30 bg-mist/70 px-6 py-10 text-center">
        <h2 className="font-display text-2xl uppercase text-wave">
          {closed.title}
        </h2>
        <p className="mt-3 text-ink/70">{closed.body}</p>
        <p className="mt-4">
          <Link
            href="/rules#registration-deadline"
            className="font-semibold text-sea underline-offset-4 hover:underline"
          >
            Registration deadline in the rules →
          </Link>
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 w-full border border-wave/20 bg-paper px-3 py-2.5 text-ink outline-none ring-sun/30 focus:ring-2";
  const labelClass =
    "block font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <p className="rounded-md border border-sun/40 bg-mist/70 px-4 py-3 text-sm text-ink/80">
        Free {YOUTH_TOURNAMENT.name} entry — no $300 boat fee and no team
        side pots. Register for RowRide separately. Kids may fish from land
        or by boat. They are not added to a boat roster.{" "}
        <Link href="/register" className="font-semibold text-sea hover:underline">
          Register an adults-only boat →
        </Link>
      </p>

      {formError ? (
        <p className="rounded-md bg-alert/10 px-4 py-3 text-sm text-alert" role="alert">
          {formError}
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="teamName">
          Household or kids name <span className="text-alert">*</span>
        </label>
        <input
          id="teamName"
          className={inputClass}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. The Crain kids"
          required
        />
        {err("teamName")}
      </div>

      <div>
        <label className={labelClass} htmlFor="registrantEmail">
          Parent or guardian email <span className="text-alert">*</span>
        </label>
        <input
          id="registrantEmail"
          type="email"
          className={inputClass}
          value={registrantEmail}
          onChange={(e) => setRegistrantEmail(e.target.value)}
          required
        />
        {err("registrantEmail")}
      </div>

      <div data-field="anglers">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-wave">
              Youth anglers <span className="text-alert">*</span>
            </h3>
            <p className="text-sm text-ink/65">
              {MIN_YOUTH_ANGLERS}–{MAX_YOUTH_ANGLERS} kids, 17 or under.{" "}
              {YOUTH_EMAIL_HELPER}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!canAdd) return;
              setKids((prev) => [...prev, emptyYouth()]);
            }}
            disabled={!canAdd}
            className="text-sm font-semibold text-sea disabled:opacity-40"
          >
            + Add youth
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {kids.map((kid, index) => (
            <div
              key={index}
              className="grid gap-3 border border-wave/15 bg-paper p-4 sm:grid-cols-2 lg:grid-cols-[1fr_7.5rem_1fr_1fr_auto]"
            >
              <div>
                <label className={labelClass} htmlFor={`youth-name-${index}`}>
                  Name <span className="text-alert">*</span>
                </label>
                <input
                  id={`youth-name-${index}`}
                  className={inputClass}
                  value={kid.fullName}
                  onChange={(e) => updateKid(index, { fullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`youth-shirt-${index}`}>
                  Shirt size <span className="text-alert">*</span>
                </label>
                <ShirtSizeSelect
                  id={`youth-shirt-${index}`}
                  className={inputClass}
                  value={kid.shirtSize}
                  onChange={(shirtSize) => updateKid(index, { shirtSize })}
                  required
                />
                {err(`angler-shirt-${index}`)}
              </div>
              <div>
                <label className={labelClass} htmlFor={`youth-email-${index}`}>
                  Email (optional)
                </label>
                <input
                  id={`youth-email-${index}`}
                  type="email"
                  className={inputClass}
                  value={kid.email}
                  onChange={(e) => updateKid(index, { email: e.target.value })}
                />
                {err(`angler-email-${index}`)}
              </div>
              <div>
                <label className={labelClass} htmlFor={`youth-phone-${index}`}>
                  Phone (optional)
                </label>
                <input
                  id={`youth-phone-${index}`}
                  type="tel"
                  className={inputClass}
                  value={kid.phone}
                  maxLength={14}
                  onChange={(e) =>
                    updateKid(index, { phone: formatPhoneInput(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    setKids((prev) =>
                      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
                    )
                  }
                  disabled={kids.length <= 1}
                  className="pb-2.5 text-sm text-alert disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        {err("anglers")}
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          className={`${inputClass} min-h-24`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 border border-wave/15 bg-mist/70 px-4 py-3">
        <input
          id="licenseConfirmed"
          type="checkbox"
          checked={licenseConfirmed}
          onChange={(e) => setLicenseConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 accent-sea"
        />
        <span className="text-sm leading-relaxed">
          {LICENSE_CONFIRM_LABEL} <span className="text-alert">*</span>
        </span>
      </label>
      {err("licenseConfirmed")}

      <label className="flex items-start gap-3 border border-wave/15 bg-mist/70 px-4 py-3">
        <input
          id="youthGuardianAttested"
          type="checkbox"
          checked={youthGuardianAttested}
          onChange={(e) => setYouthGuardianAttested(e.target.checked)}
          className="mt-1 h-4 w-4 accent-sea"
        />
        <span className="text-sm leading-relaxed">
          {YOUTH_ATTESTATION_LABEL} <span className="text-alert">*</span>
        </span>
      </label>
      {err("youthGuardianAttested")}

      <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg">
          Total due: <span className="font-semibold">$0</span>
          <span className="block text-sm text-ink/60">
            Host-funded RowRide — no boat entry
          </span>
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center bg-wave px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-paper transition hover:bg-sea disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Enter RowRide"}
        </button>
      </div>
    </form>
  );
}
