import { authorName, authorTeamName, commentAuthorName } from "./authors";
import { prisma } from "./db";
import { estimateFishFromPhoto } from "./fish-ai";
import { guestSafeAiNotes } from "./guest-copy";
import { notifyAnglersOfNewCatch } from "./notify";
import { uploadCatchPhoto } from "./storage";
import { findAnglerForUser, type PublicUser } from "./users";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 10 * 1024 * 1024;

function extensionFor(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

const catchListSelect = {
  id: true,
  photoPath: true,
  breed: true,
  lengthInches: true,
  weightLbs: true,
  confidence: true,
  aiNotes: true,
  aiProvider: true,
  createdAt: true,
  userId: true,
  anglerId: true,
  user: {
    select: {
      id: true,
      name: true,
      claimedTeam: { select: { teamName: true } },
    },
  },
  angler: {
    select: {
      id: true,
      fullName: true,
      team: { select: { teamName: true } },
    },
  },
  comments: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
      angler: { select: { id: true, fullName: true } },
    },
  },
};

export type CatchAuthorGroup = {
  id: string;
  fullName: string;
  teamName: string;
  catches: {
    id: string;
    photoPath: string;
    breed: string;
    lengthInches: number;
    weightLbs: number;
    confidence: number | null;
    aiNotes: string | null;
    aiProvider: string;
    createdAt: Date;
    comments: {
      id: string;
      body: string;
      createdAt: Date;
      authorName: string;
    }[];
  }[];
};

export async function listCatchesGroupedByAuthor(): Promise<CatchAuthorGroup[]> {
  const catches = await prisma.fishCatch.findMany({
    orderBy: { createdAt: "desc" },
    select: catchListSelect,
  });

  const groups = new Map<string, CatchAuthorGroup>();
  for (const c of catches) {
    const key = c.userId ? `user:${c.userId}` : `angler:${c.anglerId ?? c.id}`;
    const mapped = {
      id: c.id,
      photoPath: c.photoPath,
      breed: c.breed,
      lengthInches: c.lengthInches,
      weightLbs: c.weightLbs,
      confidence: c.confidence,
      aiNotes: c.aiNotes,
      aiProvider: c.aiProvider,
      createdAt: c.createdAt,
      comments: c.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        authorName: commentAuthorName(comment),
      })),
    };
    const existing = groups.get(key);
    if (existing) {
      existing.catches.push(mapped);
      continue;
    }
    groups.set(key, {
      id: key,
      fullName: authorName(c),
      teamName: authorTeamName(c),
      catches: [mapped],
    });
  }

  return Array.from(groups.values());
}

/** Heaviest catches for the homepage Brag Board (not official standings). */
export async function listBragBoardCatches(limit = 5) {
  const catches = await prisma.fishCatch.findMany({
    orderBy: [{ weightLbs: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      breed: true,
      lengthInches: true,
      weightLbs: true,
      aiNotes: true,
      user: {
        select: {
          name: true,
          claimedTeam: { select: { teamName: true } },
        },
      },
      angler: {
        select: {
          fullName: true,
          team: { select: { teamName: true } },
        },
      },
    },
  });

  return catches.map((c) => ({
    id: c.id,
    teamName: authorTeamName(c) || authorName(c),
    breed: c.breed,
    lengthInches: c.lengthInches,
    weightLbs: c.weightLbs,
    note: guestSafeAiNotes(c.aiNotes),
  }));
}

export type CreateCatchResult =
  | {
      ok: true;
      catch: Awaited<ReturnType<typeof saveCatchPhotoAndEstimate>>;
      notify: { alerted: true; channel: "in-app" };
    }
  | { ok: false; error: string; status: number };

async function saveCatchPhotoAndEstimate(input: {
  userId: string;
  anglerId: string | null;
  file: File;
}) {
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const mime = input.file.type || "image/jpeg";
  const ext = extensionFor(mime);
  const id = crypto.randomUUID();
  const photoPath = await uploadCatchPhoto({ id, bytes, mime, ext });

  const estimate = await estimateFishFromPhoto(bytes.toString("base64"), mime);

  return prisma.fishCatch.create({
    data: {
      userId: input.userId,
      anglerId: input.anglerId,
      photoPath,
      breed: estimate.breed,
      lengthInches: estimate.lengthInches,
      weightLbs: estimate.weightLbs,
      confidence: estimate.confidence,
      aiNotes: guestSafeAiNotes(estimate.notes),
      aiProvider: estimate.provider,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          claimedTeam: { select: { teamName: true } },
        },
      },
      angler: {
        select: {
          id: true,
          fullName: true,
          team: { select: { teamName: true } },
        },
      },
    },
  });
}

export async function createCatchFromUpload(
  formData: FormData,
  user: PublicUser,
): Promise<CreateCatchResult> {
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Photo is required", status: 400 };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Photo must be 10MB or smaller", status: 400 };
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Use a JPEG, PNG, WebP, or HEIC photo",
      status: 400,
    };
  }

  const angler = await findAnglerForUser(user.id, user.name);

  try {
    const saved = await saveCatchPhotoAndEstimate({
      userId: user.id,
      anglerId: angler?.id ?? null,
      file,
    });
    const notify = await notifyAnglersOfNewCatch({
      catchId: saved.id,
      breed: saved.breed,
      lengthInches: saved.lengthInches,
      weightLbs: saved.weightLbs,
      anglerName: authorName(saved),
      teamName: authorTeamName(saved) || authorName(saved),
    });
    return { ok: true, catch: saved, notify };
  } catch (err) {
    console.error("Failed to save catch", err);
    return { ok: false, error: "Could not save catch", status: 500 };
  }
}
