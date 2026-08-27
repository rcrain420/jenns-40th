"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FEE_PER_ANGLER_CENTS,
  MAX_ANGLERS,
  MIN_ANGLERS,
  PAID_SIDE_POTS,
  SIDE_POT_BUY_IN_CENTS,
  type SidePotId,
} from "@/lib/config";
import { formatUsd } from "@/lib/money";
import { formatPhoneInput } from "@/lib/phone";
import type { PublicUser } from "@/lib/users";
import { ResendConfirmButton } from "./ResendConfirmButton";

type BoatType = "GUIDED" | "NON_GUIDED";

type AnglerDraft = {
  fullName: string;
  phone: string;
};

type FieldErrors = Record<string, string[] | undefined>;

const emptyAngler = (): AnglerDraft => ({ fullName: "", phone: "" });

const FIELD_ORDER = [
  "teamName",
  "boatType",
  "captainName",
  "captainPhone",
  "contactName",
  "contactPhone",
  "registrantEmail",
  "anglers",
  "licenseConfirmed",
] as const;

type RegisterFormProps = {
  registrationOpen: boolean;
  initialBoatType?: BoatType;
  initialCaptainName?: string;
  viewer?: PublicUser | null;
};

export function RegisterForm({
  registrationOpen,
  initialBoatType,
  initialCaptainName = "",
  viewer = null,
}: RegisterFormProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [boatType, setBoatType] = useState<BoatType | "">(initialBoatType ?? "");
  const [captainName, setCaptainName] = useState(initialCaptainName);
  const [captainPhone, setCaptainPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [registrantEmail, setRegistrantEmail] = useState(viewer?.email ?? "");
  const [notes, setNotes] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [anglers, setAnglers] = useState<AnglerDraft[]>([
    emptyAngler(),
    emptyAngler(),
  ]);
  const [sidePots, setSidePots] = useState<SidePotId[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [nameHint, setNameHint] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [suggestingNames, setSuggestingNames] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const entryCents = FEE_PER_ANGLER_CENTS * anglers.length;
  const sidePotCents = SIDE_POT_BUY_IN_CENTS * sidePots.length;
  const total = useMemo(
    () => formatUsd(entryCents + sidePotCents),
    [entryCents, sidePotCents],
  );

  function toggleSidePot(id: SidePotId) {
    setSidePots((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function suggestTeamNames() {
    setSuggestError(null);
    setSuggestingNames(true);
    try {
      const res = await fetch("/api/team-name-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hint: nameHint.trim() || undefined,
          avoid: nameSuggestions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestError(
          res.status === 401
            ? "Confirm your email to use AI name ideas."
            : (data.error ?? "Could not suggest names"),
        );
        return;
      }
      const names = Array.isArray(data.names)
        ? data.names.filter((n: unknown): n is string => typeof n === "string")
        : [];
      if (!names.length) {
        setSuggestError("No suggestions came back. Try again.");
        return;
      }
      setNameSuggestions(names);
    } catch {
      setSuggestError("Could not suggest names. Please try again.");
    } finally {
      setSuggestingNames(false);
    }
  }

  function updateAngler(index: number, patch: Partial<AnglerDraft>) {
    setAnglers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    );
  }

  function addAngler() {
    if (anglers.length >= MAX_ANGLERS) return;
    setAnglers((prev) => [...prev, emptyAngler()]);
  }

  function removeAngler(index: number) {
    if (anglers.length <= MIN_ANGLERS) return;
    setAnglers((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!teamName.trim()) next.teamName = ["Team name is required"];
    if (boatType !== "GUIDED" && boatType !== "NON_GUIDED") {
      next.boatType = ["Choose guided or non-guided"];
    }
    if (boatType === "GUIDED") {
      if (!captainName.trim()) {
        next.captainName = ["Captain name is required for guided boats"];
      }
      if (!captainPhone.trim()) {
        next.captainPhone = ["Captain phone is required for guided boats"];
      }
    }
    if (boatType === "NON_GUIDED") {
      if (!contactName.trim()) {
        next.contactName = ["Primary contact name is required"];
      }
      if (!contactPhone.trim()) {
        next.contactPhone = ["Primary contact phone is required"];
      }
    }
    if (!registrantEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrantEmail.trim())) {
      next.registrantEmail = ["Valid email required"];
    }
    const named = anglers.filter((a) => a.fullName.trim());
    if (named.length < MIN_ANGLERS) {
      next.anglers = [`At least ${MIN_ANGLERS} anglers required`];
    }
    if (!licenseConfirmed) {
      next.licenseConfirmed = [
        "You must confirm each angler has a valid fishing license",
      ];
    }
    return next;
  }

  function focusFirstError(errors: FieldErrors) {
    const key = FIELD_ORDER.find((field) => errors[field]?.length);
    if (!key) return;
    const el =
      document.getElementById(key) ??
      document.querySelector<HTMLElement>(`[data-field="${key}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus({ preventScroll: true });
    } else {
      el?.querySelector<HTMLInputElement>("input, textarea, button")?.focus({
        preventScroll: true,
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      window.setTimeout(() => focusFirstError(clientErrors), 0);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          boatType,
          captainName,
          captainPhone,
          contactName,
          contactPhone,
          contactEmail: boatType === "NON_GUIDED" ? registrantEmail : "",
          registrantEmail,
          notes,
          licenseConfirmed: licenseConfirmed ? true : false,
          anglers,
          sidePots,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Registration failed");
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          window.setTimeout(() => focusFirstError(data.fieldErrors), 0);
        }
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
    return (
      <div className="border border-dashed border-wave/30 bg-mist/70 px-6 py-10 text-center">
        <h2 className="font-display text-2xl uppercase text-wave">
          Registration closed
        </h2>
        <p className="mt-3 text-ink/70">
          Public registration ended October 1, 2026, or the tournament is at
          capacity. Contact the organizers if you need help.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 w-full border border-wave/20 bg-paper px-3 py-2.5 text-ink outline-none ring-sun/30 focus:ring-2";
  const labelClass =
    "block font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80";

  function err(key: string) {
    const messages = fieldErrors[key];
    if (!messages?.length) return null;
    return (
      <p id={`${key}-error`} className="mt-1 text-sm text-alert" role="alert">
        {messages[0]}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {formError && (
        <p className="rounded-md bg-alert/10 px-4 py-3 text-sm text-alert" role="alert">
          {formError}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="teamName">
          Team name <span className="text-alert">*</span>
        </label>
        <input
          id="teamName"
          className={inputClass}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.teamName?.length)}
          aria-describedby={fieldErrors.teamName?.length ? "teamName-error" : undefined}
        />
        {err("teamName")}

        {viewer ? (
          <div className="mt-4 space-y-3">
            {viewer.emailVerified ? (
              <>
                <div>
                  <label className={labelClass} htmlFor="nameHint">
                    Name vibe (optional)
                  </label>
                  <input
                    id="nameHint"
                    className={inputClass}
                    value={nameHint}
                    onChange={(e) => setNameHint(e.target.value)}
                    placeholder="e.g. punny, family last name, redfish theme"
                    maxLength={200}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={suggestTeamNames}
                    disabled={suggestingNames}
                    className="text-sm font-semibold text-sea disabled:opacity-50"
                  >
                    {suggestingNames
                      ? "Thinking of names…"
                      : nameSuggestions.length
                        ? "Suggest more names"
                        : "Suggest names with AI"}
                  </button>
                  {suggestError && (
                    <p className="text-sm text-alert">{suggestError}</p>
                  )}
                </div>
                {nameSuggestions.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="Suggested team names">
                    {nameSuggestions.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          onClick={() => setTeamName(name)}
                          className={`border px-3 py-1.5 text-left text-sm transition ${
                            teamName === name
                              ? "border-sun bg-mist text-wave"
                              : "border-wave/20 bg-paper text-ink hover:border-sea/50"
                          }`}
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="space-y-3 rounded-md border border-wave/15 bg-mist/60 px-4 py-4">
                <p className="text-sm text-ink/70">
                  Confirm <strong>{viewer.email}</strong> to unlock AI team-name
                  ideas. You can still register without that.
                </p>
                <ResendConfirmButton next="/register" />
              </div>
            )}
          </div>
        ) : null}
      </div>

      <fieldset data-field="boatType" id="boatType">
        <legend className={labelClass}>
          Boat type <span className="text-alert">*</span>
        </legend>
        <p className="mt-1 text-sm text-ink/65">
          Pick one. Guided is not assumed — a captain may never log in.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["GUIDED", "Guided", "You’ll add the captain’s name and phone"],
              [
                "NON_GUIDED",
                "Non-guided",
                "You’ll add a primary contact name and phone",
              ],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 border px-4 py-3 transition ${
                boatType === value
                  ? "border-sun bg-mist"
                  : "border-wave/20 bg-paper hover:border-sea/50"
              }`}
            >
              <input
                type="radio"
                name="boatType"
                value={value}
                checked={boatType === value}
                onChange={() => setBoatType(value)}
                className="mt-1 h-4 w-4 shrink-0 accent-sea"
              />
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-ink/65">{hint}</span>
              </span>
            </label>
          ))}
        </div>
        {err("boatType")}
      </fieldset>

      {boatType === "GUIDED" ? (
        <div className="space-y-3">
          <p className="text-sm text-ink/65">
            You add the captain — they do not need an account. Still looking?{" "}
            <Link href="/guides" className="font-semibold text-sea hover:underline">
              Search Rockport fishing guides
            </Link>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="captainName">
                Captain name <span className="text-alert">*</span>
              </label>
              <input
                id="captainName"
                className={inputClass}
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                required
                aria-invalid={Boolean(fieldErrors.captainName?.length)}
                aria-describedby={
                  fieldErrors.captainName?.length ? "captainName-error" : undefined
                }
              />
              {err("captainName")}
            </div>
            <div>
              <label className={labelClass} htmlFor="captainPhone">
                Captain phone <span className="text-alert">*</span>
              </label>
              <input
                id="captainPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(361) 555-1234"
                maxLength={14}
                className={inputClass}
                value={captainPhone}
                onChange={(e) =>
                  setCaptainPhone(formatPhoneInput(e.target.value))
                }
                required
                aria-invalid={Boolean(fieldErrors.captainPhone?.length)}
                aria-describedby={
                  fieldErrors.captainPhone?.length ? "captainPhone-error" : undefined
                }
              />
              {err("captainPhone")}
            </div>
          </div>
        </div>
      ) : null}

      {boatType === "NON_GUIDED" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="contactName">
              Primary contact name <span className="text-alert">*</span>
            </label>
            <input
              id="contactName"
              className={inputClass}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.contactName?.length)}
              aria-describedby={
                fieldErrors.contactName?.length ? "contactName-error" : undefined
              }
            />
            {err("contactName")}
          </div>
          <div>
            <label className={labelClass} htmlFor="contactPhone">
              Primary contact phone <span className="text-alert">*</span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(361) 555-1234"
              maxLength={14}
              className={inputClass}
              value={contactPhone}
              onChange={(e) =>
                setContactPhone(formatPhoneInput(e.target.value))
              }
              required
              aria-invalid={Boolean(fieldErrors.contactPhone?.length)}
              aria-describedby={
                fieldErrors.contactPhone?.length ? "contactPhone-error" : undefined
              }
            />
            {err("contactPhone")}
          </div>
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="registrantEmail">
          Your email <span className="text-alert">*</span>
        </label>
        <p className="mt-1 text-sm text-ink/65">
          For your account and the unlock link
          {boatType === "NON_GUIDED"
            ? ", and as the primary contact email"
            : ""}
          . A confirmation email may also go here — the next page still has the
          links if mail does not send.
        </p>
        <input
          id="registrantEmail"
          type="email"
          className={inputClass}
          value={registrantEmail}
          onChange={(e) => setRegistrantEmail(e.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.registrantEmail?.length)}
          aria-describedby={
            fieldErrors.registrantEmail?.length
              ? "registrantEmail-error"
              : undefined
          }
        />
        {err("registrantEmail")}
      </div>

      <div data-field="anglers">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-wave">
              Anglers <span className="text-alert">*</span>
            </h3>
            <p className="text-sm text-ink/65">
              {MIN_ANGLERS}–{MAX_ANGLERS} fishing anglers (captain not included).
              Need two names to lock the boat — add the rest later from My team.
            </p>
          </div>
          <button
            type="button"
            onClick={addAngler}
            disabled={anglers.length >= MAX_ANGLERS}
            className="text-sm font-semibold text-sea disabled:opacity-40"
          >
            + Add angler
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {anglers.map((angler, index) => (
            <div
              key={index}
              className="grid gap-3 border border-wave/15 bg-paper p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label className={labelClass} htmlFor={`angler-name-${index}`}>
                  Angler {index + 1} name <span className="text-alert">*</span>
                </label>
                <input
                  id={`angler-name-${index}`}
                  className={inputClass}
                  value={angler.fullName}
                  onChange={(e) =>
                    updateAngler(index, { fullName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`angler-phone-${index}`}>
                  Phone (optional)
                </label>
                <input
                  id={`angler-phone-${index}`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(361) 555-1234"
                  maxLength={14}
                  className={inputClass}
                  value={angler.phone}
                  onChange={(e) =>
                    updateAngler(index, {
                      phone: formatPhoneInput(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeAngler(index)}
                  disabled={anglers.length <= MIN_ANGLERS}
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
        <h3 className="font-display text-xl text-wave">
          Optional side pots
        </h3>
        <p className="text-sm text-ink/65">
          {formatUsd(SIDE_POT_BUY_IN_CENTS)} per team, per pot — enter one,
          two, or all three. You can also join at Friday&apos;s captain&apos;s
          meeting.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PAID_SIDE_POTS.map((pot) => {
            const checked = sidePots.includes(pot.id);
            return (
              <label
                key={pot.id}
                className={`flex cursor-pointer items-start gap-3 border px-4 py-3 transition ${
                  checked
                    ? "border-sun bg-mist"
                    : "border-wave/20 bg-paper hover:border-sea/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSidePot(pot.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-sea"
                />
                <span>
                  <span className="block font-semibold">{pot.name}</span>
                  <span className="mt-1 block text-sm text-ink/65">
                    {formatUsd(SIDE_POT_BUY_IN_CENTS)} per team
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {err("sidePots")}
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

      <label
        data-field="licenseConfirmed"
        className="flex items-start gap-3 border border-wave/15 bg-mist/70 px-4 py-3"
      >
        <input
          id="licenseConfirmed"
          type="checkbox"
          checked={licenseConfirmed}
          onChange={(e) => setLicenseConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 accent-sea"
          required
          aria-invalid={Boolean(fieldErrors.licenseConfirmed?.length)}
          aria-describedby={
            fieldErrors.licenseConfirmed?.length
              ? "licenseConfirmed-error"
              : undefined
          }
        />
        <span className="text-sm leading-relaxed">
          I confirm each angler on this team has a valid fishing license.{" "}
          <span className="text-alert">*</span>
        </span>
      </label>
      {err("licenseConfirmed")}

      <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg">
          Total due: <span className="font-semibold">{total}</span>
          <span className="block text-sm text-ink/60">
            {formatUsd(FEE_PER_ANGLER_CENTS)} × {anglers.length} anglers
            {sidePots.length > 0
              ? ` + ${sidePots.length} side pot${
                  sidePots.length > 1 ? "s" : ""
                } (${formatUsd(sidePotCents)})`
              : ""}{" "}
            · pay via Venmo after submit
          </span>
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center bg-wave px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-paper transition hover:bg-sea disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit registration"}
        </button>
      </div>
    </form>
  );
}
