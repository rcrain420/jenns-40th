"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  CatchComments,
  type CatchCommentItem,
} from "./CatchComments";
import type { PublicUser } from "@/lib/users";

export type CatchCardFish = {
  id: string;
  photoPath: string;
  breed: string;
  lengthInches: number;
  weightLbs: number;
  confidence: number | null;
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
};

export function CatchCard({ fish, anglerName, viewer }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#catch-${fish.id}`) {
      setOpen(true);
    }
  }, [fish.id]);

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
          <p className="text-sm text-ink/70">
            {fish.lengthInches}&quot; · {fish.weightLbs} lb
          </p>
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
