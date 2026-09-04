"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhoneInput } from "@/lib/phone";
import { CAPTAIN_CONTACT_ADULT_NOTE } from "@/lib/youth";

type BoatType = "GUIDED" | "NON_GUIDED";

type Props = {
  boatType: BoatType;
  captainName: string;
  captainPhone: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export function TeamCaptainEditor({
  boatType: initialBoatType,
  captainName: initialCaptainName,
  captainPhone: initialCaptainPhone,
  contactName: initialContactName,
  contactPhone: initialContactPhone,
  contactEmail: initialContactEmail,
}: Props) {
  const router = useRouter();
  const [boatType, setBoatType] = useState<BoatType>(initialBoatType);
  const [captainName, setCaptainName] = useState(initialCaptainName);
  const [captainPhone, setCaptainPhone] = useState(initialCaptainPhone);
  const [contactName, setContactName] = useState(initialContactName);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const inputClass =
    "mt-1.5 w-full border border-wave/20 bg-paper px-3 py-2.5 text-ink outline-none ring-sun/30 focus:ring-2";
  const labelClass =
    "block font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80";

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatType,
          captainName,
          captainPhone,
          contactName,
          contactPhone,
          contactEmail,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save captain");
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

  return (
    <form onSubmit={onSave} className="space-y-4">
      <p className="text-sm text-ink/65">{CAPTAIN_CONTACT_ADULT_NOTE}</p>
      <fieldset>
        <legend className={labelClass}>Boat type</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {(
            [
              ["GUIDED", "Guided"],
              ["NON_GUIDED", "Non-guided"],
            ] as const
          ).map(([value, title]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="teamBoatType"
                value={value}
                checked={boatType === value}
                onChange={() => setBoatType(value)}
                className="h-4 w-4 accent-sea"
              />
              {title}
            </label>
          ))}
        </div>
      </fieldset>

      {boatType === "GUIDED" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="team-captain-name">
              Captain name (optional)
            </label>
            <input
              id="team-captain-name"
              className={inputClass}
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Add anytime"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="team-captain-phone">
              Captain phone (optional)
            </label>
            <input
              id="team-captain-phone"
              type="tel"
              inputMode="numeric"
              className={inputClass}
              value={captainPhone}
              maxLength={14}
              onChange={(e) => setCaptainPhone(formatPhoneInput(e.target.value))}
              placeholder="(361) 555-1234"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="team-contact-name">
              Primary contact name (optional)
            </label>
            <input
              id="team-contact-name"
              className={inputClass}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Add anytime"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="team-contact-phone">
              Primary contact phone (optional)
            </label>
            <input
              id="team-contact-phone"
              type="tel"
              inputMode="numeric"
              className={inputClass}
              value={contactPhone}
              maxLength={14}
              onChange={(e) => setContactPhone(formatPhoneInput(e.target.value))}
              placeholder="(361) 555-1234"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="team-contact-email">
              Primary contact email (optional)
            </label>
            <input
              id="team-contact-email"
              type="email"
              className={inputClass}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
      )}

      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-sea" role="status">
          Captain and contact saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-wave px-5 py-3 font-semibold text-salt hover:bg-ink disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save captain"}
      </button>
    </form>
  );
}
