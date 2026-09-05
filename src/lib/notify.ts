export type CatchNotifyPayload = {
  catchId: string;
  breed: string;
  lengthInches: number | null;
  weightLbs: number | null;
  anglerName: string;
  teamName: string;
};

export type CommentNotifyPayload = {
  commentId: string;
  catchId: string;
  breed: string;
  commenterName: string;
  catchOwnerName: string;
  snippet: string;
};

export type BellNotificationType = "catch" | "comment";

export type BellNotification = {
  id: string;
  type: BellNotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: string;
};

const FUN_LINES = [
  (p: CatchNotifyPayload) =>
    `${p.anglerName} just put a ${p.breed} on the board — time to talk trash.`,
  (p: CatchNotifyPayload) =>
    p.weightLbs == null
      ? `${p.teamName} just dropped a photo on the board. Weighmaster still undecided.`
      : `${p.teamName} is on the board with a ${p.weightLbs} lb AI guess. Weighmaster still undecided.`,
  (p: CatchNotifyPayload) =>
    p.lengthInches == null
      ? `Photo dropped: ${p.anglerName}'s ${p.breed}. For fun only — scale day is later.`
      : `Photo dropped: ${p.anglerName}'s ${p.breed} (${p.lengthInches}"). For fun only — scale day is later.`,
  (p: CatchNotifyPayload) =>
    `${p.anglerName} logged a catch. Comment if you dare. Estimates ≠ weigh-in.`,
  (p: CatchNotifyPayload) =>
    `Fleet alert: ${p.teamName} thinks they have a ${p.breed}. Prove 'em wrong at 2 p.m.`,
] as const;

const COMMENT_LINES = [
  (p: CommentNotifyPayload) =>
    `${p.commenterName} just talked trash on ${p.catchOwnerName}'s ${p.breed}.`,
  (p: CommentNotifyPayload) =>
    `${p.commenterName} left a note on a ${p.breed}: “${p.snippet}”`,
  (p: CommentNotifyPayload) =>
    `Livewell chatter: ${p.commenterName} commented on ${p.catchOwnerName}'s catch.`,
  (p: CommentNotifyPayload) =>
    `${p.catchOwnerName}'s ${p.breed} got a comment from ${p.commenterName}.`,
] as const;

function stableLineIndex(seed: string, lineCount: number): number {
  return (
    Math.abs([...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) %
    lineCount
  );
}

export function catchAlertHref(catchId: string): string {
  return `/catches#catch-${catchId}`;
}

export function commentAlertHref(catchId: string): string {
  return catchAlertHref(catchId);
}

export function commentSnippet(body: string, max = 80): string {
  const text = body.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

export function catchAlertHeadline(payload: CatchNotifyPayload): string {
  return FUN_LINES[stableLineIndex(payload.catchId, FUN_LINES.length)]!(payload);
}

export function commentAlertHeadline(payload: CommentNotifyPayload): string {
  return COMMENT_LINES[
    stableLineIndex(payload.commentId, COMMENT_LINES.length)
  ]!(payload);
}

/** The comment author should not see a bell item for their own comment. */
export function isOwnCommentNotification(
  commentUserId: string | null | undefined,
  viewerUserId: string | null | undefined,
): boolean {
  return Boolean(
    viewerUserId && commentUserId && commentUserId === viewerUserId,
  );
}

export function toCatchBellNotification(input: {
  catchId: string;
  breed: string;
  lengthInches: number | null;
  weightLbs: number | null;
  anglerName: string;
  teamName: string;
  createdAt: string;
}): BellNotification {
  const payload: CatchNotifyPayload = {
    catchId: input.catchId,
    breed: input.breed,
    lengthInches: input.lengthInches,
    weightLbs: input.weightLbs,
    anglerName: input.anglerName,
    teamName: input.teamName,
  };
  return {
    id: `catch:${input.catchId}`,
    type: "catch",
    title: `${input.anglerName} · ${input.breed}`,
    body: catchAlertHeadline(payload),
    href: catchAlertHref(input.catchId),
    createdAt: input.createdAt,
  };
}

export function toCommentBellNotification(input: {
  commentId: string;
  catchId: string;
  breed: string;
  commenterName: string;
  catchOwnerName: string;
  body: string;
  createdAt: string;
}): BellNotification {
  const snippet = commentSnippet(input.body);
  const payload: CommentNotifyPayload = {
    commentId: input.commentId,
    catchId: input.catchId,
    breed: input.breed,
    commenterName: input.commenterName,
    catchOwnerName: input.catchOwnerName,
    snippet,
  };
  return {
    id: `comment:${input.commentId}`,
    type: "comment",
    title: `${input.commenterName} commented`,
    body: commentAlertHeadline(payload),
    href: commentAlertHref(input.catchId),
    createdAt: input.createdAt,
  };
}

/** Newest first. Catch + comment rows share one limit for the bell. */
export function mergeBellNotifications(
  items: BellNotification[],
  limit: number,
): BellNotification[] {
  return [...items]
    .sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
        return a.createdAt < b.createdAt ? 1 : -1;
      }
      return a.id < b.id ? 1 : -1;
    })
    .slice(0, Math.max(limit, 0));
}

/**
 * Catch uploads fan out as in-app bell alerts (clients poll recent catches).
 * Email blast is intentionally retired — keep the fleet on the Livewell.
 */
export async function notifyAnglersOfNewCatch(
  payload: CatchNotifyPayload,
): Promise<{ alerted: true; channel: "in-app" }> {
  console.info(`[notify] in-app catch alert queued: ${payload.catchId}`);
  return { alerted: true, channel: "in-app" };
}

/**
 * New comments persist as CatchComment rows; the bell polls those the same
 * way it polls catches. No extra Notification table — same derived feed.
 */
export async function notifyAnglersOfNewComment(payload: {
  commentId: string;
  catchId: string;
}): Promise<{ alerted: true; channel: "in-app" }> {
  console.info(
    `[notify] in-app comment alert queued: ${payload.commentId} on ${payload.catchId}`,
  );
  return { alerted: true, channel: "in-app" };
}
