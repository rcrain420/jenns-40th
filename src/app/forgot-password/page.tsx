"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ForgotForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/catches";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not send reset email");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rope-frame paper-panel mx-auto w-full max-w-md px-6 py-10">
      <h1 className="font-display text-3xl uppercase text-wave">
        Forgot password
      </h1>
      {sent ? (
        <p className="mt-4 text-ink/75">
          If that email has an account, we sent a reset link. Check your inbox
          and spam.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-semibold text-wave">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
            />
          </div>
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
            {loading ? "Sending…" : "Email me a reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-sea hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <Suspense>
        <ForgotForm />
      </Suspense>
    </main>
  );
}
