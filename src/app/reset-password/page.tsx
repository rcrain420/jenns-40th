"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PasswordField } from "@/components/PasswordField";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const next = searchParams.get("next") || "/catches";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not reset password");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rope-frame paper-panel mx-auto w-full max-w-md px-6 py-10">
        <h1 className="font-display text-3xl uppercase text-wave">
          Reset password
        </h1>
        <p className="mt-4 text-ink/75">
          This link is missing. Request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block font-semibold text-sea hover:underline"
        >
          Email me a reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="rope-frame paper-panel mx-auto w-full max-w-md px-6 py-10">
      <h1 className="font-display text-3xl uppercase text-wave">
        Choose a new password
      </h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <PasswordField
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          label="New password"
        />
        {error ? (
          <p className="text-sm text-alert" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-sun px-5 py-3 font-semibold text-ink disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save and sign in"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <Suspense>
        <ResetForm />
      </Suspense>
    </main>
  );
}
