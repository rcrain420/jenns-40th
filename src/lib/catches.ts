import { prisma } from "./db";
import { estimateFishFromPhoto } from "./fish-ai";
import { notifyAnglersOfNewCatch } from "./notify";
import { uploadCatchPhoto } from "./storage";

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

export async function listAnglersForCatchLog() {
  return prisma.angler.findMany({
    orderBy: [{ team: { teamName: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      fullName: true,
      team: { select: { id: true, teamName: true } },
    },
  });
}

export async function listCatchesGroupedByAngler() {
  const anglers = await prisma.angler.findMany({
    orderBy: [{ team: { teamName: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      fullName: true,
      team: { select: { teamName: true } },
      catches: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          photoPath: true,
          breed: true,
          lengthInches: true,
          weightLbs: true,
          confidence: true,
          aiNotes: true,
          aiProvider: true,
          createdAt: true,
          comments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              body: true,
              createdAt: true,
              angler: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });

  return anglers.filter((a) => a.catches.length > 0);
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
      angler: {
        select: {
          team: { select: { teamName: true } },
        },
      },
    },
  });

  return catches.map((c) => ({
    id: c.id,
    teamName: c.angler.team.teamName,
    breed: c.breed,
    lengthInches: c.lengthInches,
    weightLbs: c.weightLbs,
    note: c.aiNotes,
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
  anglerId: string;
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
      anglerId: input.anglerId,
      photoPath,
      breed: estimate.breed,
      lengthInches: estimate.lengthInches,
      weightLbs: estimate.weightLbs,
      confidence: estimate.confidence,
      aiNotes: estimate.notes,
      aiProvider: estimate.provider,
    },
    include: {
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
): Promise<CreateCatchResult> {
  const anglerId = String(formData.get("anglerId") ?? "").trim();
  const file = formData.get("photo");

  if (!anglerId) {
    return { ok: false, error: "Select an angler", status: 400 };
  }
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

  const angler = await prisma.angler.findUnique({ where: { id: anglerId } });
  if (!angler) {
    return { ok: false, error: "Angler not found", status: 404 };
  }

  try {
    const saved = await saveCatchPhotoAndEstimate({ anglerId, file });
    const notify = await notifyAnglersOfNewCatch({
      catchId: saved.id,
      breed: saved.breed,
      lengthInches: saved.lengthInches,
      weightLbs: saved.weightLbs,
      anglerName: saved.angler.fullName,
      teamName: saved.angler.team.teamName,
    });
    return { ok: true, catch: saved, notify };
  } catch (err) {
    console.error("Failed to save catch", err);
    return { ok: false, error: "Could not save catch", status: 500 };
  }
}
