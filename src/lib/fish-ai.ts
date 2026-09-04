import { GUEST_AI_UNAVAILABLE_NOTE, guestSafeAiNotes } from "./guest-copy";
import {
  FISH_AI_TIMEOUT_MS,
  type EstimateFishInput,
  resolveOpenAiApiKey,
  shouldSkipOpenAiEstimate,
  visionImageUrl,
} from "./fish-ai-vision";
import {
  UNKNOWN_FISH_BREED,
  fishEstimateChatBody,
  normalizeFishBreed,
  type FishEstimateBreed,
} from "./fish-species";
import { raceTimeout } from "./race-timeout";

export type { FishEstimateBreed };

export type FishEstimate = {
  breed: FishEstimateBreed;
  lengthInches: number;
  weightLbs: number;
  confidence: number | null;
  notes: string | null;
  provider: "openai" | "fallback";
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
} from "./fish-ai-vision";

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

export function normalizeEstimate(
  raw: AiJson,
  provider: FishEstimate["provider"],
): FishEstimate {
  const length = clamp(asNumber(raw.lengthInches) ?? 18, 4, 80);
  const weight = clamp(asNumber(raw.weightLbs) ?? 3, 0.2, 120);
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
    lengthInches: Math.round(length * 10) / 10,
    weightLbs: Math.round(weight * 10) / 10,
    confidence,
    notes,
    provider,
  };
}

export function fallbackEstimate(): FishEstimate {
  return {
    breed: UNKNOWN_FISH_BREED,
    lengthInches: 18,
    weightLbs: 3.5,
    confidence: null,
    notes: GUEST_AI_UNAVAILABLE_NOTE,
    provider: "fallback",
  };
}

/**
 * Estimate species, length, and weight from a catch photo using OpenAI vision.
 * Always settles — missing key, unsupported photo, timeout, or API failure
 * return placeholder numbers plus a guest-safe note (never hang the Livewell).
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
    return fallbackEstimate();
  }
  if (skip) {
    console.warn("Fish AI estimate skipped:", skip, input.mimeType);
    return fallbackEstimate();
  }

  const imageUrl = visionImageUrl(input);
  if (!imageUrl) {
    return fallbackEstimate();
  }

  const timeoutMs = options.timeoutMs ?? FISH_AI_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;

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
    });

    const res = await raceTimeout(request, timeoutMs, "Fish AI estimate timed out");

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("OpenAI fish estimate failed", res.status, detail);
      return fallbackEstimate();
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
      return fallbackEstimate();
    }

    const parsed = JSON.parse(content) as AiJson;
    return normalizeEstimate(parsed, "openai");
  } catch (err) {
    console.error("Fish AI estimate error", err);
    return fallbackEstimate();
  }
}
