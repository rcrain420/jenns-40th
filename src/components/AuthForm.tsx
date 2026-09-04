"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notifyAuthChanged } from "@/lib/auth-client";
import { oauthErrorMessage } from "@/lib/oauth-errors";
import { afterAuthPath, userHasRegisteredTeam } from "@/lib/register-logged-in";
import type { PublicUser } from "@/lib/users";
import { PasswordField } from "./PasswordField";

export type AuthMode = "signin" | "signup";

type OAuthButtons = {
  google: boolean;
  facebook: boolean;
};

type Props = {
  mode?: AuthMode;
  next?: string;
  compact?: boolean;
  initialEmail?: string;
  initialName?: string;
  initialError?: string | null;
  onSuccess?: () => void;
};

function oauthStartHref(provider: "google" | "facebook", next: string) {
  const params = new URLSearchParams({ next });
  return `/api/auth/oauth/${provider}/start?${params.toString()}`;
}

export function AuthForm({
  mode: initialMode = "signin",
  next = "/catches",
  compact = false,
  initialEmail = "",
  initialName = "",
  initialError = null,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const [devConfirmUrl, setDevConfirmUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<OAuthButtons>({
    google: false,
    facebook: false,
  });

  useEffect(() => {
    const fromUrl = oauthErrorMessage(
      new URLSearchParams(window.location.search).get("oauthError"),
    );
    if (fromUrl) setError(fromUrl);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/oauth/providers")
      .then((res) => res.json())
      .then((data: Partial<OAuthButtons>) => {
        if (cancelled) return;
        setOauth({
          google: Boolean(data.google),
          facebook: Boolean(data.facebook),
        });
      })
      .catch(() => {
        // Buttons stay hidden — email/password still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        user?: PublicUser | null;
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
          next.startsWith("/join")
            ? "Account created. Finish joining — that unlocks the Livewell on this device."
            : next.startsWith("/team")
              ? "Account created. You’re on this boat — roster and Livewell, no PIN."
              : next.startsWith("/register")
                ? "Account created. You can still register your team — confirm later to post catches."
                : "Account created. We could not send the confirmation email — you can still join a team. Confirm later to post catches.",
        );
      }
      notifyAuthChanged();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(
          afterAuthPath({
            next,
            hasTeam: userHasRegisteredTeam(data.user),
          }),
        );
      }
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  const showOauth = oauth.google || oauth.facebook;

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md bg-alert/10 px-3 py-2 text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}

      {showOauth ? (
        <div className="space-y-2">
          {oauth.google ? (
            <a
              href={oauthStartHref("google", next)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-5 py-3 text-base font-semibold text-ink transition hover:bg-mist"
            >
              <GoogleMark />
              Continue with Google
            </a>
          ) : null}
          {oauth.facebook ? (
            <a
              href={oauthStartHref("facebook", next)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-5 py-3 text-base font-semibold text-ink transition hover:bg-mist"
            >
              <FacebookMark />
              Continue with Facebook
            </a>
          ) : null}
          <p className="flex items-center gap-3 pt-1 text-center text-sm text-ink/45">
            <span className="h-px flex-1 bg-[var(--line)]" />
            or email
            <span className="h-px flex-1 bg-[var(--line)]" />
          </p>
        </div>
      ) : null}

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
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.6-5.4 3.6-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-4-3c-1.1.8-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.3 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4V6.5H1.3C.5 8.2 0 10.1 0 12s.5 3.8 1.3 5.5l4.1-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5C17.9 1.1 15.2 0 12 0 7.4 0 3.3 2.7 1.3 6.5l4.1 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#1877F2"
        d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9v2.2h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"
      />
    </svg>
  );
}
