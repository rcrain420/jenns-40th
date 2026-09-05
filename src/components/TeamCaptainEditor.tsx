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
  captainEmail: string;
  captainStatus?: "captain" | "captain-joined" | "captain-pending" | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export function TeamCaptainEditor({
  boatType: initialBoatType,
  captainName: initialCaptainName,
  captainPhone: initialCaptainPhone,
  captainEmail: initialCaptainEmail,
  captainStatus = null,
  contactName: initialContactName,
  contactPhone: initialContactPhone,
  contactEmail: initialContactEmail,
}: Props) {
  const router = useRouter();
  const [boatType, setBoatType] = useState<BoatType>(initialBoatType);
  const [captainName, setCaptainName] = useState(initialCaptainName);
  const [captainPhone, setCaptainPhone] = useState(initialCaptainPhone);
  const [captainEmail, setCaptainEmail] = useState(initialCaptainEmail);
  const [contactName, setContactName] = useState(initialContactName);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const inputClass =
    "mt-1.5 w-full border border-wave/20 bg-paper px-3 py-2.5 text-ink outline-none ring-sun/30 focus:ring-2";
  const labelClass =
    "block font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80";

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatType,
          captainName,
          captainPhone,
          captainEmail,
          contactName,
          contactPhone,
          contactEmail,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        inviteSent?: boolean;
        inviteError?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not save captain");
        return;
      }
      if (data.inviteError) {
        setSaved("Captain saved. Could not send invite — save again to retry.");
      } else if (data.inviteSent) {
        setSaved("Captain saved. Invite sent.");
      } else {
        setSaved("Captain and contact saved.");
      }
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  const statusLabel =
    captainStatus === "captain-joined"
      ? "Captain · Joined"
      : captainStatus === "captain-pending"
        ? "Captain · Pending"
        : null;

  return (
    <form onSubmit={onSave} className="space-y-4">
      <p className="text-sm text-ink/65">{CAPTAIN_CONTACT_ADULT_NOTE}</p>
      <p className="text-sm text-ink/65">
        Add a captain email to invite them. They can sign in and see what
        anglers see. That does not add $75 unless they are also an adult
        angler.
      </p>
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
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="team-captain-email">
            Captain email (optional)
          </label>
          <input
            id="team-captain-email"
            type="email"
            autoComplete="email"
            className={inputClass}
            value={captainEmail}
            onChange={(e) => setCaptainEmail(e.target.value)}
            placeholder="Invites them to sign in"
          />
          {statusLabel ? (
            <p className="mt-1.5 text-sm text-ink/55">{statusLabel}</p>
          ) : null}
        </div>
      </div>

      {boatType === "NON_GUIDED" ? (
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
      ) : null}

      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-sea" role="status">
          {saved}
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
