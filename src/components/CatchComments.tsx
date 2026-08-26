"use client";

import { useState } from "react";
import { EventPinGate } from "./EventPinGate";
import type { CatchAnglerOption } from "./CatchLogger";

export type CatchCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  angler: { id: string; fullName: string };
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
  anglers: CatchAnglerOption[];
  initialComments: CatchCommentItem[];
};

export function CatchComments({ catchId, anglers, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [anglerId, setAnglerId] = useState(anglers[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!anglerId) {
      setError("Select who is commenting");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/catches/${catchId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anglerId, body }),
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
              <p className="font-semibold text-wave">{c.angler.fullName}</p>
              <p className="text-ink/80">{c.body}</p>
              <p className="text-xs text-ink/40">
                {formatCommentTime(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {anglers.length > 0 && (
        <EventPinGate
          title="Unlock comments"
          description="Use the link from your registration email, or enter the event PIN to post."
        >
          <form onSubmit={onSubmit} className="space-y-2">
            <select
              value={anglerId}
              onChange={(e) => setAnglerId(e.target.value)}
              aria-label="Commenting as"
              className="w-full rounded-md border border-[var(--line)] bg-salt px-2.5 py-2 text-sm outline-none focus:border-sea"
            >
              {anglers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>
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
        </EventPinGate>
      )}
    </div>
  );
}
