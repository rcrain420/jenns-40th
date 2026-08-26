"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/users";
import { AuthForm } from "./AuthForm";

export type CatchCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
};

function formatCommentTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

type Props = {
  catchId: string;
  viewer: PublicUser | null;
  initialComments: CatchCommentItem[];
};

export function CatchComments({ catchId, viewer, initialComments }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/catches/${catchId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json()) as {
        error?: string;
        comment?: CatchCommentItem;
      };
      if (!res.ok || !data.comment) {
        setError(data.error ?? "Could not post comment");
        return;
      }
      setComments((prev) => [...prev, data.comment!]);
      setBody("");
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-[var(--line)] pt-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
        Comments · {comments.length}
      </p>

      {comments.length === 0 ? (
        <p className="text-sm text-ink/50">No comments yet — say something.</p>
      ) : (
        <ul className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <p className="font-semibold text-wave">{c.authorName}</p>
              <p className="text-ink/80">{c.body}</p>
              <p className="text-xs text-ink/40">
                {formatCommentTime(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!viewer ? (
        <div className="space-y-2">
          <p className="text-sm text-ink/65">Sign in to comment.</p>
          <AuthForm
            next="/catches"
            compact
            onSuccess={() => router.refresh()}
          />
        </div>
      ) : !viewer.emailVerified ? (
        <p className="text-sm text-ink/65">
          Confirm {viewer.email} to comment as yourself.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2">
          <p className="text-xs text-ink/50">Commenting as {viewer.name}</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Nice fish!"
            className="w-full resize-none rounded-md border border-[var(--line)] bg-salt px-2.5 py-2 text-sm outline-none focus:border-sea"
          />
          {error && (
            <p className="text-xs text-alert" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-wave px-3 py-1.5 text-sm font-semibold text-salt hover:bg-ink disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      )}
    </div>
  );
}
