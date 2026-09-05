"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CatchComments,
  type CatchCommentItem,
} from "./CatchComments";
import { formatCatchSizeLine } from "@/lib/catch-size";
import { guestFallbackAiNote } from "@/lib/guest-copy";
import type { PublicUser } from "@/lib/users";

export type CatchCardFish = {
  id: string;
  photoPath: string;
  breed: string;
  lengthInches: number | null;
  weightLbs: number | null;
  confidence: number | null;
  aiProvider?: string | null;
  aiNotes?: string | null;
  createdAt: string;
  comments: CatchCommentItem[];
};

function formatCaughtAt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

type Props = {
  fish: CatchCardFish;
  anglerName: string;
  viewer: PublicUser | null;
  onDeleted?: (id: string) => void;
};

export function CatchCard({ fish, anglerName, viewer, onDeleted }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const commentIds = fish.comments.map((c) => c.id).join("\0");

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash;
      if (hash === `#catch-${fish.id}`) {
        setOpen(true);
        return;
      }
      const ids = commentIds ? commentIds.split("\0") : [];
      if (ids.some((id) => hash === `#comment-${id}`)) {
        setOpen(true);
      }
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [fish.id, commentIds]);

  async function onDelete() {
    if (
      !confirm(
        "Delete this Livewell post? Comments on it will be removed too.",
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/catches/${fish.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Could not delete post");
        return;
      }
      setRemoved(true);
      onDeleted?.(fish.id);
      router.refresh();
    } catch {
      setDeleteError("Network error — try again");
    } finally {
      setDeleting(false);
    }
  }

  if (removed) return null;

  return (
    <li id={`catch-${fish.id}`} className="group scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <div className="relative aspect-square overflow-hidden rounded-lg bg-mist">
          <Image
            src={fish.photoPath}
            alt={`${fish.breed} caught by ${anglerName}`}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="font-semibold leading-tight text-wave">{fish.breed}</p>
          <p className="text-sm text-ink/70">{formatCatchSizeLine(fish)}</p>
          {fish.aiProvider === "fallback" ? (
            <p className="text-xs text-ink/55">
              {guestFallbackAiNote(fish.aiProvider, fish.aiNotes)}
            </p>
          ) : null}
          <p className="text-xs text-ink/45">
            {formatCaughtAt(fish.createdAt)}
            {fish.confidence != null
              ? ` · ${Math.round(fish.confidence * 100)}%`
              : ""}
            {` · ${fish.comments.length} ${
              fish.comments.length === 1 ? "comment" : "comments"
            }`}
          </p>
        </div>
      </button>

      {viewer?.isAdmin ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="min-h-11 rounded-md px-3 py-1.5 text-sm font-semibold text-alert hover:bg-alert/10 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete post"}
          </button>
          {deleteError ? (
            <p className="mt-1 text-xs text-alert" role="alert">
              {deleteError}
            </p>
          ) : null}
        </div>
      ) : null}

      {open && (
        <CatchComments
          catchId={fish.id}
          viewer={viewer}
          initialComments={fish.comments}
        />
      )}
    </li>
  );
}
