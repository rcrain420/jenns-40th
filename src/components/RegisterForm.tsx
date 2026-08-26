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

type BoatType = "GUIDED" | "NON_GUIDED";

type AnglerDraft = {
  fullName: string;
  phone: string;
};

type FieldErrors = Record<string, string[] | undefined>;

const emptyAngler = (): AnglerDraft => ({ fullName: "", phone: "" });

type RegisterFormProps = {
  registrationOpen: boolean;
  initialBoatType?: BoatType;
  initialCaptainName?: string;
  viewer?: PublicUser | null;
};

export function RegisterForm({
  registrationOpen,
  initialBoatType = "GUIDED",
  initialCaptainName = "",
  viewer = null,
}: RegisterFormProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [boatType, setBoatType] = useState<BoatType>(initialBoatType);
  const [captainName, setCaptainName] = useState(initialCaptainName);
  const [captainPhone, setCaptainPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
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
            ? "Sign in and confirm your email to use AI name ideas."
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
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
          contactEmail,
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
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      router.push(`/register/success?team=${data.team.id}`);
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
    return <p className="mt-1 text-sm text-alert">{messages[0]}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <label className={labelClass} htmlFor="teamName">
          Team name
        </label>
        <input
          id="teamName"
          className={inputClass}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
        {err("teamName")}

        <div className="mt-4 space-y-3">
          {viewer?.emailVerified ? (
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
            <p className="text-sm text-ink/60">
              <Link href="/login?next=/register" className="font-semibold text-sea hover:underline">
                Sign in and confirm your email
              </Link>{" "}
              to get AI team-name ideas.
            </p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Boat type</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["GUIDED", "Guided", "Include your captain’s name and phone"],
              [
                "NON_GUIDED",
                "Non-guided",
                "Include a primary contact for the team",
              ],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className={`cursor-pointer border px-4 py-3 transition ${
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
                className="sr-only"
              />
              <span className="block font-semibold">{title}</span>
              <span className="mt-1 block text-sm text-ink/65">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {boatType === "GUIDED" ? (
        <div className="space-y-3">
          <p className="text-sm text-ink/65">
            Still looking?{" "}
            <Link href="/guides" className="font-semibold text-sea hover:underline">
              Search Rockport fishing guides
            </Link>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="captainName">
                Captain name
              </label>
              <input
                id="captainName"
                className={inputClass}
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                required
              />
              {err("captainName")}
            </div>
            <div>
              <label className={labelClass} htmlFor="captainPhone">
                Captain phone
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
              />
              {err("captainPhone")}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="contactName">
              Primary contact name
            </label>
            <input
              id="contactName"
              className={inputClass}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
            {err("contactName")}
          </div>
          <div>
            <label className={labelClass} htmlFor="contactPhone">
              Primary contact phone
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
            />
            {err("contactPhone")}
          </div>
          <div>
            <label className={labelClass} htmlFor="contactEmail">
              Primary contact email
            </label>
            <input
              id="contactEmail"
              type="email"
              className={inputClass}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
            {err("contactEmail")}
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="registrantEmail">
          Your email (confirmation + unlock link)
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

      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-wave">Anglers</h3>
            <p className="text-sm text-ink/65">
              {MIN_ANGLERS}–{MAX_ANGLERS} fishing anglers (captain not included)
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
                  Angler {index + 1} name
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
                className={`cursor-pointer border px-4 py-3 transition ${
                  checked
                    ? "border-sun bg-mist"
                    : "border-wave/20 bg-paper hover:border-sea/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSidePot(pot.id)}
                  className="sr-only"
                />
                <span className="block font-semibold">{pot.name}</span>
                <span className="mt-1 block text-sm text-ink/65">
                  {formatUsd(SIDE_POT_BUY_IN_CENTS)} per team
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

      <label className="flex items-start gap-3 border border-wave/15 bg-mist/70 px-4 py-3">
        <input
          type="checkbox"
          checked={licenseConfirmed}
          onChange={(e) => setLicenseConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 accent-sea"
          required
        />
        <span className="text-sm leading-relaxed">
          I confirm each angler on this team has a valid fishing license.
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

      {formError && (
        <p className="rounded-md bg-alert/10 px-4 py-3 text-sm text-alert">
          {formError}
        </p>
      )}
    </form>
  );
}
