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

type DecodedPhoto = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  close: () => void;
};

async function decodeCatchPhoto(file: File): Promise<DecodedPhoto | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, width, height) => ctx.drawImage(bitmap, 0, 0, width, height),
        close: () => bitmap.close(),
      };
    } catch {
      // iOS gallery HEIC sometimes fails createImageBitmap; Image() often works.
    }
  }

  if (typeof document === "undefined" || typeof Image === "undefined") {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image decode failed"));
      el.src = objectUrl;
    });
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, width, height) => ctx.drawImage(img, 0, 0, width, height),
      close: () => {},
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Convert camera / gallery photos to a modest JPEG. iOS can decode HEIC
 * into a bitmap; if that fails we send the original and the server skips AI.
 */
export async function prepareCatchPhotoForUpload(file: File): Promise<File> {
  if (shouldReuseCatchPhoto(file)) return file;
  if (typeof document === "undefined") {
    return file;
  }

  const decoded = await decodeCatchPhoto(file);
  if (!decoded || decoded.width < 1 || decoded.height < 1) {
    return file;
  }

  try {
    const scale = Math.min(
      1,
      CATCH_PHOTO_MAX_EDGE / Math.max(decoded.width, decoded.height),
    );
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      decoded.close();
      return file;
    }
    decoded.draw(ctx, width, height);
    decoded.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", CATCH_PHOTO_JPEG_QUALITY);
    });
    if (!blob || blob.size === 0) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "catch";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    decoded.close();
    return file;
  }
}
