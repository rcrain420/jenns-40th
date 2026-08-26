"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { PublicUser } from "@/lib/users";
import { AuthForm } from "./AuthForm";
import { ConfirmEmailPanel } from "./ConfirmEmailPanel";

type Props = {
  viewer: PublicUser | null;
};

type LoggedCatch = {
  id: string;
  photoPath: string;
  breed: string;
  lengthInches: number;
  weightLbs: number;
  confidence: number | null;
  aiNotes: string | null;
  aiProvider: string;
};

export function CatchLogger({ viewer }: Props) {
  const router = useRouter();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCatch, setLastCatch] = useState<LoggedCatch | null>(null);
  const [notifyNote, setNotifyNote] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onFileChange(next: FileList | null) {
    const selected = next?.[0] ?? null;
    setError(null);
    setLastCatch(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLastCatch(null);
    setNotifyNote(null);

    if (!file) {
      setError("Take or choose a photo of the fish");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.set("photo", file);

      const res = await fetch("/api/catches", { method: "POST", body });
      const data = (await res.json()) as {
        error?: string;
        catch?: LoggedCatch;
        notify?: { alerted?: boolean; channel?: string };
      };

      if (!res.ok || !data.catch) {
        setError(data.error ?? "Could not log catch");
        return;
      }

      setLastCatch(data.catch);
      setNotifyNote(
        "Caught on the board! The notification bell just buzzed the fleet — remind everyone these AI pounds are for trash talk only.",
      );
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (!viewer) {
    return (
      <div className="space-y-4 rounded-xl bg-white px-5 py-8 shadow-[0_20px_60px_rgba(6,28,40,0.08)] md:px-8">
        <p className="font-display text-xs uppercase tracking-[0.18em] text-sea">
          Log in to post
        </p>
        <h2 className="font-display text-2xl text-wave">Post your catch</h2>
        <p className="text-ink/70">
          Create an account (or sign in) right here — then confirm your email
          and the camera unlocks.
        </p>
        <AuthForm next="/catches" compact onSuccess={() => router.refresh()} />
      </div>
    );
  }

  if (!viewer.emailVerified) {
    return <ConfirmEmailPanel email={viewer.email} next="/catches" />;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-xl bg-white px-5 py-8 shadow-[0_20px_60px_rgba(6,28,40,0.08)] md:px-8"
    >
      <p className="text-sm font-semibold text-wave">
        Posting as {viewer.name}
        {viewer.teamName ? (
          <span className="font-normal text-ink/55"> · {viewer.teamName}</span>
        ) : null}
      </p>

      <div>
        <p className="text-sm font-semibold text-wave">Fish photo</p>
        <p className="mt-1 text-sm text-ink/60">
          Use the camera on your phone, or pick a photo from the gallery. AI
          size guesses are for laughs — the official scale decides winners.
        </p>
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files)}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-wave px-5 py-2.5 text-sm font-semibold text-salt transition hover:bg-ink"
          >
            {previewUrl ? "Retake / replace photo" : "Take or choose photo"}
          </label>
        </div>

        {previewUrl && (
          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg bg-mist">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected catch preview"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-alert/10 px-3 py-2 text-sm text-alert" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-md bg-sun px-5 py-3 text-base font-semibold text-ink transition hover:brightness-105 disabled:opacity-60 md:w-auto"
      >
        {submitting ? "Estimating with AI…" : "Log catch & estimate"}
      </button>

      {lastCatch && (
        <div className="animate-rise border-t border-[var(--line)] pt-6">
          <p className="text-sm uppercase tracking-[0.18em] text-sea">
            Fun estimate logged
          </p>
          <p className="mt-1 text-sm text-ink/60">
            Not for weigh-in. Just enough data to start an argument.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-mist">
              <Image
                src={lastCatch.photoPath}
                alt={lastCatch.breed}
                fill
                className="object-cover"
                sizes="140px"
                unoptimized
              />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:text-base">
              <div>
                <dt className="text-ink/55">Breed</dt>
                <dd className="font-semibold text-wave">{lastCatch.breed}</dd>
              </div>
              <div>
                <dt className="text-ink/55">Length</dt>
                <dd className="font-semibold text-wave">
                  {lastCatch.lengthInches}&quot;
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">Weight</dt>
                <dd className="font-semibold text-wave">
                  {lastCatch.weightLbs} lb
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">Confidence</dt>
                <dd className="font-semibold text-wave">
                  {lastCatch.confidence == null
                    ? "—"
                    : `${Math.round(lastCatch.confidence * 100)}%`}
                </dd>
              </div>
            </dl>
          </div>
          {lastCatch.aiNotes && (
            <p className="mt-3 text-sm text-ink/65">{lastCatch.aiNotes}</p>
          )}
          {notifyNote && (
            <p className="mt-3 text-sm text-sea">{notifyNote}</p>
          )}
        </div>
      )}
    </form>
  );
}
