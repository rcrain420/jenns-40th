/**
 * Leaf helpers for Livewell vision estimates. Node tests import this
 * without extension rewriting.
 */

/**
 * OpenAI vision + image download. 12s was too tight once production sent a
 * Blob URL for OpenAI to fetch (PR #17) — every call fell through to
 * placeholders. Client CATCH_SUBMIT_TIMEOUT_MS is 35s; stay under that.
 */
export const FISH_AI_TIMEOUT_MS = 25_000;

/** Skip data-URL payloads larger than this (raw bytes, before base64). */
export const FISH_AI_MAX_BASE64_BYTES = 4 * 1024 * 1024;

const VISION_OK = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type EstimateFishInput = {
  mimeType: string;
  imageUrl?: string;
  imageBase64?: string;
};

export function resolveOpenAiApiKey(override?: string | null): string {
  if (override !== undefined) return override?.trim() ?? "";
  return process.env.OPENAI_API_KEY?.trim() ?? "";
}

export function visionMimeSupported(mimeType: string): boolean {
  const mime = mimeType.toLowerCase().split(";")[0]?.trim() || "image/jpeg";
  return VISION_OK.has(mime);
}

function publicImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https:\/\//i.test(trimmed)) return null;
  return trimmed;
}

/**
 * Prefer an inlined data URL so OpenAI does not have to fetch Vercel Blob.
 * Blob-only URLs were the production path after PR #17 and fail closed
 * (timeout / download error) into identical placeholder sizes.
 * Null = skip OpenAI.
 */
export function visionImageUrl(input: EstimateFishInput): string | null {
  if (!visionMimeSupported(input.mimeType)) return null;

  const mime = input.mimeType.toLowerCase().split(";")[0]?.trim() || "image/jpeg";
  const base64 = input.imageBase64?.trim();
  if (base64) {
    const approxBytes = Math.ceil((base64.length * 3) / 4);
    if (approxBytes <= FISH_AI_MAX_BASE64_BYTES) {
      return `data:${mime};base64,${base64}`;
    }
  }

  return publicImageUrl(input.imageUrl);
}

export function shouldSkipOpenAiEstimate(
  input: EstimateFishInput,
  apiKey: string,
): string | null {
  if (!apiKey) return "missing-key";
  if (!visionMimeSupported(input.mimeType)) return "unsupported-type";
  if (!visionImageUrl(input)) return "no-usable-image";
  return null;
}
