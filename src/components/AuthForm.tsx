"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifyAuthChanged } from "@/lib/auth-client";
import { PasswordField } from "./PasswordField";

export type AuthMode = "signin" | "signup";

type Props = {
  mode?: AuthMode;
  next?: string;
  compact?: boolean;
  initialEmail?: string;
  initialName?: string;
  onSuccess?: () => void;
};

export function AuthForm({
  mode: initialMode = "signin",
  next = "/catches",
  compact = false,
  initialEmail = "",
  initialName = "",
  onSuccess,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devConfirmUrl, setDevConfirmUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setDevConfirmUrl(null);
    setLoading(true);
    try {
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          next,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        devConfirmUrl?: string;
        confirmationEmailSent?: boolean;
      };
      if (!res.ok) {
        if (data.code === "exists") setMode("signin");
        if (data.code === "missing") setMode("signup");
        setError(data.error ?? "Could not continue");
        return;
      }
      if (data.devConfirmUrl) setDevConfirmUrl(data.devConfirmUrl);
      if (mode === "signup" && data.confirmationEmailSent === false) {
        setNotice(
          "Account created. We could not send the confirmation email — you can still join a team. Confirm later to post catches.",
        );
      }
      notifyAuthChanged();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(next);
      }
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" ? (
        <div>
          <label htmlFor="auth-name" className="block text-sm font-semibold text-wave">
            Your name
          </label>
          <input
            id="auth-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="auth-email" className="block text-sm font-semibold text-wave">
          Email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
        />
      </div>

      <PasswordField
        value={password}
        onChange={setPassword}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />

      {error ? (
        <p className="rounded-md bg-alert/10 px-3 py-2 text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-md bg-mist px-3 py-2 text-sm text-wave" role="status">
          {notice}
        </p>
      ) : null}

      {devConfirmUrl && process.env.NODE_ENV !== "production" ? (
        <p className="text-sm text-sea">
          Local dev:{" "}
          <Link href={devConfirmUrl} className="underline">
            confirm email
          </Link>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-sun px-5 py-3 text-base font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
      >
        {loading
          ? "Working…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>

      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${compact ? "" : "justify-between"}`}>
        <button
          type="button"
          className="font-semibold text-sea hover:underline"
          onClick={() => {
            setError(null);
            setNotice(null);
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        {mode === "signin" ? (
          <Link
            href={`/forgot-password?next=${encodeURIComponent(next)}`}
            className="text-ink/60 hover:underline"
          >
            Forgot password?
          </Link>
        ) : null}
      </div>
    </form>
  );
}
