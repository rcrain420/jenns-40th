export type FishEstimate = {
  breed: string;
  lengthInches: number;
  weightLbs: number;
  confidence: number | null;
  notes: string | null;
  provider: "openai" | "fallback";
};

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

function normalizeEstimate(raw: AiJson, provider: FishEstimate["provider"]): FishEstimate {
  const length = clamp(asNumber(raw.lengthInches) ?? 18, 4, 80);
  const weight = clamp(asNumber(raw.weightLbs) ?? 3, 0.2, 120);
  const confidenceRaw = asNumber(raw.confidence);
  const confidence =
    confidenceRaw == null ? null : clamp(confidenceRaw, 0, 1);
  const breed =
    typeof raw.breed === "string" && raw.breed.trim()
      ? raw.breed.trim()
      : "Unidentified fish";
  const notes =
    typeof raw.notes === "string" && raw.notes.trim()
      ? raw.notes.trim()
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

function fallbackEstimate(): FishEstimate {
  return {
    breed: "Unidentified Gulf fish",
    lengthInches: 18,
    weightLbs: 3.5,
    confidence: null,
    notes:
      "AI estimation unavailable (set OPENAI_API_KEY). Logged with placeholder estimates — edit after weigh-in if needed.",
    provider: "fallback",
  };
}

/**
 * Estimate species, length, and weight from a catch photo using OpenAI vision.
 * Falls back to placeholders when no API key is configured or the call fails.
 */
export async function estimateFishFromPhoto(
  imageBase64: string,
  mimeType: string,
): Promise<FishEstimate> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return fallbackEstimate();
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an expert ichthyologist for Texas Gulf Coast recreational fishing (Rockport / Aransas Bay). From a photo, estimate the fish breed/species, total length in inches, and weight in pounds. Prefer common names used by Texas anglers (e.g. Red drum/Redfish, Speckled trout, Flounder, Black drum, Sheepshead, Spanish mackerel). If unsure, say so in notes and lower confidence. Respond ONLY with JSON: {\"breed\":string,\"lengthInches\":number,\"weightLbs\":number,\"confidence\":number,\"notes\":string}. confidence is 0-1.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Estimate this catch. Use any visible scale, lure, hand, or deck for size reference if present.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("OpenAI fish estimate failed", res.status, detail);
      return {
        ...fallbackEstimate(),
        notes: "AI request failed; logged with placeholder estimates.",
      };
    }

    const data = (await res.json()) as {
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
    return {
      ...fallbackEstimate(),
      notes: "AI estimation error; logged with placeholder estimates.",
    };
  }
}
