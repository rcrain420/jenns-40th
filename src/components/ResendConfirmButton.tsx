"use client";

import Link from "next/link";
import { useState } from "react";

export function ResendConfirmButton({ next = "/catches" }: { next?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [devConfirmUrl, setDevConfirmUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onResend() {
    setLoading(true);
    setMessage(null);
    setDevConfirmUrl(null);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        devConfirmUrl?: string;
      };
      if (!res.ok) {
        setMessage(data.error ?? "Could not send — sign in and try again");
        return;
      }
      if (data.devConfirmUrl) setDevConfirmUrl(data.devConfirmUrl);
      setMessage(data.error ?? "Sent — check your inbox (and spam).");
    } catch {
      setMessage("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onResend}
        disabled={loading}
        className="w-full rounded-md bg-wave px-5 py-3 font-semibold text-salt hover:bg-ink disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send a new link"}
      </button>
      {message ? <p className="text-sm text-ink/70">{message}</p> : null}
      {devConfirmUrl ? (
        <p className="text-sm text-sea">
          Local dev:{" "}
          <Link href={devConfirmUrl} className="underline">
            confirm email
          </Link>
        </p>
      ) : null}
    </div>
  );
}
