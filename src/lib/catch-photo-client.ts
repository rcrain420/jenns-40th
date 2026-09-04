/** Downscale / convert before upload so /api/catches and vision stay fast. */
export const CATCH_PHOTO_MAX_EDGE = 1600;
export const CATCH_PHOTO_JPEG_QUALITY = 0.82;
export const CATCH_PHOTO_REUSE_MAX_BYTES = 400_000;

/** Whole Livewell POST — Blob + estimate + DB. Must exceed FISH_AI_TIMEOUT_MS. */
export const CATCH_SUBMIT_TIMEOUT_MS = 35_000;

export const CATCH_SUBMIT_TIMEOUT_ERROR =
  "That took too long — try again. A smaller JPEG or PNG usually works.";

export function shouldReuseCatchPhoto(file: { size: number; type: string }): boolean {
  const type = file.type.toLowerCase();
  return (
    file.size <= CATCH_PHOTO_REUSE_MAX_BYTES &&
    (type === "image/jpeg" || type === "image/jpg" || type === "image/webp")
  );
}

/**
 * Convert camera / gallery photos to a modest JPEG. iOS can decode HEIC
 * into a bitmap; if that fails we send the original and the server skips AI.
 */
export async function prepareCatchPhotoForUpload(file: File): Promise<File> {
  if (shouldReuseCatchPhoto(file)) return file;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      CATCH_PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", CATCH_PHOTO_JPEG_QUALITY);
    });
    if (!blob || blob.size === 0) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "catch";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
