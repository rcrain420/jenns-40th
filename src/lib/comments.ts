import { prisma } from "./db";

const MAX_BODY = 500;

export type CommentDto = {
  id: string;
  body: string;
  createdAt: string;
  angler: { id: string; fullName: string };
};

export function serializeComment(c: {
  id: string;
  body: string;
  createdAt: Date;
  angler: { id: string; fullName: string };
}): CommentDto {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    angler: c.angler,
  };
}

export async function listCommentsForCatch(catchId: string) {
  return prisma.catchComment.findMany({
    where: { catchId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      angler: { select: { id: true, fullName: true } },
    },
  });
}

export type AddCommentResult =
  | { ok: true; comment: CommentDto }
  | { ok: false; error: string; status: number };

export async function addCatchComment(input: {
  catchId: string;
  anglerId: string;
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

  const [fish, angler] = await Promise.all([
    prisma.fishCatch.findUnique({ where: { id: input.catchId } }),
    prisma.angler.findUnique({ where: { id: input.anglerId } }),
  ]);

  if (!fish) {
    return { ok: false, error: "Catch not found", status: 404 };
  }
  if (!angler) {
    return { ok: false, error: "Angler not found", status: 404 };
  }

  const created = await prisma.catchComment.create({
    data: {
      catchId: input.catchId,
      anglerId: input.anglerId,
      body,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      angler: { select: { id: true, fullName: true } },
    },
  });

  return { ok: true, comment: serializeComment(created) };
}
