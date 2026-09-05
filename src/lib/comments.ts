import { commentAuthorName } from "./authors";
import { prisma } from "./db";
import { notifyAnglersOfNewComment } from "./notify";
import { findAnglerForUser, type PublicUser } from "./users";

const MAX_BODY = 500;

export type CommentDto = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
};

export function serializeComment(c: {
  id: string;
  body: string;
  createdAt: Date;
  user?: { name: string } | null;
  angler?: { id: string; fullName: string } | null;
}): CommentDto {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    authorName: commentAuthorName(c),
  };
}

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  user: { select: { name: true } },
  angler: { select: { id: true, fullName: true } },
} as const;

export async function listCommentsForCatch(catchId: string) {
  return prisma.catchComment.findMany({
    where: { catchId },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });
}

export type AddCommentResult =
  | { ok: true; comment: CommentDto }
  | { ok: false; error: string; status: number };

export async function addCatchComment(input: {
  catchId: string;
  user: PublicUser;
  body: string;
}): Promise<AddCommentResult> {
  const body = input.body.trim();
  if (!body) {
    return { ok: false, error: "Comment can’t be empty", status: 400 };
  }
  if (body.length > MAX_BODY) {
    return {
      ok: false,
      error: `Comment must be ${MAX_BODY} characters or fewer`,
      status: 400,
    };
  }

  const fish = await prisma.fishCatch.findUnique({
    where: { id: input.catchId },
  });
  if (!fish) {
    return { ok: false, error: "Catch not found", status: 404 };
  }

  const angler = await findAnglerForUser(input.user.id, input.user.name);

  const created = await prisma.catchComment.create({
    data: {
      catchId: input.catchId,
      userId: input.user.id,
      anglerId: angler?.id ?? null,
      body,
    },
    select: commentSelect,
  });

  await notifyAnglersOfNewComment({
    commentId: created.id,
    catchId: input.catchId,
  });

  return { ok: true, comment: serializeComment(created) };
}
