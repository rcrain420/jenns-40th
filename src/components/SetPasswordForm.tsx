"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifyAuthChanged } from "@/lib/auth-client";
import { PasswordField } from "./PasswordField";

type Props = {
  email: string;
  initialName?: string;
};

export function SetPasswordForm({ email, initialName = "" }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devConfirmUrl, setDevConfirmUrl] = useState<string | null>(null);
  const [mailSent, setMailSent] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Tell us your name — not the captain’s unless that is also you.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          next: "/catches",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        devConfirmUrl?: string;
        confirmationEmailSent?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not create account");
        return;
      }
      setDevConfirmUrl(data.devConfirmUrl ?? null);
      setMailSent(data.confirmationEmailSent ?? false);
      setDone(true);
      notifyAuthChanged();
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-ink/75">
        Account saved for <strong>{email}</strong>. You&apos;re on the boat
        list now. Confirming email is only needed to post catches
        {mailSent
          ? " — check your inbox when you want to do that."
          : " — we could not send that email just now. You can still invite teammates."}
        {devConfirmUrl ? (
          <>
            {" "}
            <a href={devConfirmUrl} className="font-semibold text-sea underline">
              Confirm now (local)
            </a>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-ink/75">
        Set a password for <strong>{email}</strong> so you — the person who
        registered — appear on the boat list. This is not the captain&apos;s
        login. Confirming email is only needed later to post catches.
      </p>
      <div>
        <label htmlFor="creator-name" className="block text-sm font-semibold text-wave">
          Your name <span className="text-alert">*</span>
        </label>
        <p className="mt-1 text-sm text-ink/60">
          Your name as the person who created this team — not the captain
          unless that is also you.
        </p>
        <input
          id="creator-name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
        />
      </div>
      <PasswordField
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />
      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-wave px-5 py-3 font-semibold text-salt hover:bg-ink disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
