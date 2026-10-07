"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { lineGuessPinPath } from "@/lib/line-guess-format";

export function LineGuessPinForm({ token }: { token: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(lineGuessPinPath(token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "That PIN is not right.");
        return;
      }
      setPin("");
      await router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="line-guess-pin" className="block text-sm font-semibold text-wave">
          Table PIN
        </label>
        <input
          id="line-guess-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          required
          minLength={4}
          maxLength={8}
          pattern="[0-9]*"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="btn-bay btn-bay-navy w-full disabled:opacity-50"
      >
        {submitting ? "Checking…" : "Open tracker"}
      </button>
    </form>
  );
}
