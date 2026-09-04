import {
  GUEST_AI_MISSING_KEY_NOTE,
  GUEST_AI_NO_IMAGE_NOTE,
  GUEST_AI_PROVIDER_ERROR_NOTE,
  GUEST_AI_TIMEOUT_NOTE,
  GUEST_AI_UNAVAILABLE_NOTE,
  GUEST_AI_UNSUPPORTED_PHOTO_NOTE,
  guestSafeAiNotes,
} from "./guest-copy.ts";
import {
  FISH_AI_TIMEOUT_MS,
  type EstimateFishInput,
  resolveOpenAiApiKey,
  shouldSkipOpenAiEstimate,
  visionImageUrl,
} from "./fish-ai-vision.ts";
import {
  UNKNOWN_FISH_BREED,
  fishEstimateChatBody,
  normalizeFishBreed,
  type FishEstimateBreed,
} from "./fish-species.ts";
import { raceTimeout } from "./race-timeout.ts";

export type { FishEstimateBreed };

export type FishAiFallbackReason =
  | "missing-key"
  | "unsupported-type"
  | "no-usable-image"
  | "timeout"
  | "openai-error"
  | "empty-response"
  | "bad-json";

export type FishEstimate = {
  breed: FishEstimateBreed;
  lengthInches: number | null;
  weightLbs: number | null;
  confidence: number | null;
  notes: string | null;
  provider: "openai" | "fallback";
  fallbackReason?: FishAiFallbackReason;
};

export type EstimateFishOptions = {
  apiKey?: string | null;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type { EstimateFishInput };
export {
  FISH_AI_MAX_BASE64_BYTES,
  FISH_AI_TIMEOUT_MS,
  resolveOpenAiApiKey,
  visionImageUrl,
  visionMimeSupported,
} from "./fish-ai-vision.ts";

type AiJson = {
  breed?: unknown;
  lengthInches?: unknown;
  weightLbs?: unknown;
  confidence?: unknown;
  notes?: unknown;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export function guestNoteForFallback(reason: FishAiFallbackReason): string {
  switch (reason) {
    case "missing-key":
      return GUEST_AI_MISSING_KEY_NOTE;
    case "unsupported-type":
      return GUEST_AI_UNSUPPORTED_PHOTO_NOTE;
    case "no-usable-image":
      return GUEST_AI_NO_IMAGE_NOTE;
    case "timeout":
      return GUEST_AI_TIMEOUT_NOTE;
    case "openai-error":
    case "empty-response":
    case "bad-json":
      return GUEST_AI_PROVIDER_ERROR_NOTE;
    default:
      return GUEST_AI_UNAVAILABLE_NOTE;
  }
}

export function parseAiJsonContent(content: string): AiJson | null {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(trimmed) as AiJson;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as AiJson;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function normalizeEstimate(
  raw: AiJson,
  provider: FishEstimate["provider"],
): FishEstimate {
  const lengthRaw = asNumber(raw.lengthInches);
  const weightRaw = asNumber(raw.weightLbs);
  const confidenceRaw = asNumber(raw.confidence);
  const confidence =
    confidenceRaw == null ? null : clamp(confidenceRaw, 0, 1);
  const breed = normalizeFishBreed(raw.breed);
  const notes =
    typeof raw.notes === "string" && raw.notes.trim()
      ? guestSafeAiNotes(raw.notes)
      : null;

  return {
    breed,
    lengthInches:
      lengthRaw == null ? null : Math.round(clamp(lengthRaw, 4, 80) * 10) / 10,
    weightLbs:
      weightRaw == null ? null : Math.round(clamp(weightRaw, 0.2, 120) * 10) / 10,
    confidence,
    notes,
    provider,
  };
}

/** Placeholder when vision did not run or failed. Never invent 18" / 3.5 lb. */
export function fallbackEstimate(
  reason: FishAiFallbackReason = "openai-error",
): FishEstimate {
  return {
    breed: UNKNOWN_FISH_BREED,
    lengthInches: null,
    weightLbs: null,
    confidence: null,
    notes: guestNoteForFallback(reason),
    provider: "fallback",
    fallbackReason: reason,
  };
}

function isTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === "AbortError" ||
    err.name === "TimeoutError" ||
    /timed out/i.test(err.message)
  );
}

/**
 * Estimate species, length, and weight from a catch photo using OpenAI vision.
 * Always settles — missing key, unsupported photo, timeout, or API failure
 * return Unknown + a guest-safe reason and blank size (never hang the Livewell,
 * never stamp identical fake inches/pounds).
 */
export async function estimateFishFromPhoto(
  input: EstimateFishInput,
  options: EstimateFishOptions = {},
): Promise<FishEstimate> {
  const apiKey = resolveOpenAiApiKey(options.apiKey);
  const skip = shouldSkipOpenAiEstimate(input, apiKey);
  if (skip === "missing-key") {
    console.warn(
      "Fish AI estimate skipped: OPENAI_API_KEY is not set on this server",
    );
    return fallbackEstimate("missing-key");
  }
  if (skip === "unsupported-type" || skip === "no-usable-image") {
    console.warn("Fish AI estimate skipped:", skip, input.mimeType);
    return fallbackEstimate(skip);
  }
  if (skip) {
    console.warn("Fish AI estimate skipped:", skip, input.mimeType);
    return fallbackEstimate("no-usable-image");
  }

  const imageUrl = visionImageUrl(input);
  if (!imageUrl) {
    return fallbackEstimate("no-usable-image");
  }

  const timeoutMs = options.timeoutMs ?? FISH_AI_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;

  try {
    const request = fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        fishEstimateChatBody(
          imageUrl,
          process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
        ),
      ),
      signal: controller?.signal,
    });

    let res: Response;
    try {
      res = await raceTimeout(request, timeoutMs, "Fish AI estimate timed out");
    } catch (err) {
      controller?.abort();
      if (isTimeoutError(err)) {
        console.error("Fish AI estimate error", err);
        return fallbackEstimate("timeout");
      }
      throw err;
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("OpenAI fish estimate failed", res.status, detail);
      return fallbackEstimate("openai-error");
    }

    const data = (await raceTimeout(
      res.json() as Promise<{
        choices?: { message?: { content?: string } }[];
      }>,
      timeoutMs,
      "Fish AI estimate response timed out",
    )) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackEstimate("empty-response");
    }

    const parsed = parseAiJsonContent(content);
    if (!parsed) {
      return fallbackEstimate("bad-json");
    }
    return normalizeEstimate(parsed, "openai");
  } catch (err) {
    if (isTimeoutError(err)) {
      console.error("Fish AI estimate error", err);
      return fallbackEstimate("timeout");
    }
    console.error("Fish AI estimate error", err);
    return fallbackEstimate("openai-error");
  }
}
