"use client";

import { useEffect, useState } from "react";
import { isUsableShareUrl, resolveShareUrl } from "@/lib/share-url";

type Props = {
  url: string;
  buttonLabel?: string;
  shareTitle?: string;
  shareText?: string;
};

type CopyState = "idle" | "copied" | "shared" | "error";

async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand for HTTP / denied clipboard permission.
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.focus();
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

export function InviteLinkCopy({
  url,
  buttonLabel = "Copy invite link",
  shareTitle = "Join the boat",
  shareText,
}: Props) {
  const [state, setState] = useState<CopyState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  const [canShare, setCanShare] = useState(false);
  const absoluteUrl = resolveShareUrl(url, origin);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
  }, []);

  function flash(next: CopyState) {
    setState(next);
    window.setTimeout(() => setState("idle"), 2500);
  }

  async function copy() {
    setError(null);
    const next = resolveShareUrl(url, window.location.origin);
    if (!isUsableShareUrl(next)) {
      setError("Could not build a full URL to copy. Try again from this page.");
      flash("error");
      return;
    }
    const ok = await writeClipboard(next);
    if (!ok) {
      setError("Copy failed. Select the link and copy it manually.");
      flash("error");
      return;
    }
    flash("copied");
  }

  async function share() {
    setError(null);
    const next = resolveShareUrl(url, window.location.origin);
    if (!isUsableShareUrl(next)) {
      setError("Could not build a full URL to share. Try copy instead.");
      flash("error");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: next,
        });
        flash("shared");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    const ok = await writeClipboard(next);
    if (!ok) {
      setError("Share is not available here. Select the link and copy it.");
      flash("error");
      return;
    }
    flash("copied");
  }

  const copyLabel =
    state === "copied" ? "Copied" : state === "error" ? "Copy failed" : buttonLabel;
  const shareLabel = state === "shared" ? "Shared" : "Share";

  return (
    <div className="space-y-3">
      <p className="break-all border border-wave/15 bg-paper px-3 py-2.5 font-mono text-sm text-ink">
        <a
          href={absoluteUrl}
          className="text-sea underline-offset-2 hover:underline"
        >
          {absoluteUrl}
        </a>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-md bg-wave px-5 py-2.5 text-sm font-semibold text-salt hover:bg-ink"
        >
          {copyLabel}
        </button>
        {canShare ? (
          <button
            type="button"
            onClick={() => void share()}
            className="rounded-md border border-wave/25 bg-paper px-5 py-2.5 text-sm font-semibold text-wave hover:border-sea"
          >
            {shareLabel}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : state === "copied" ? (
        <p className="text-sm text-sea" role="status">
          Link copied. Paste it anywhere.
        </p>
      ) : null}
    </div>
  );
}
