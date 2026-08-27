"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifyAuthChanged } from "@/lib/auth-client";
import { PasswordField } from "./PasswordField";

type Props = {
  email: string;
  name: string;
};

export function SetPasswordForm({ email, name }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devConfirmUrl, setDevConfirmUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      };
      if (!res.ok) {
        setError(data.error ?? "Could not create account");
        return;
      }
      setDevConfirmUrl(data.devConfirmUrl ?? null);
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
        Account saved for <strong>{email}</strong>. Confirm that email, then
        you can post catches as yourself.
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
        Want to post catches later? Set a password for{" "}
        <strong>{email}</strong>.
      </p>
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
