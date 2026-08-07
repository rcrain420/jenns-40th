import { EVENT } from "@/lib/config";

export type TeamNameSuggestions = {
  names: string[];
  provider: "openai" | "fallback";
};

type AiJson = {
  names?: unknown;
};

const FALLBACK_NAMES = [
  "Reel Birthday Bash",
  "Forty & Fabulous Fishers",
  "Rockport Reds",
  "Jenn's Hooked Crew",
  "Gulf Coast Legends",
  "Cast Away Party",
  "Bay Day Bandits",
  "Speck-tacular Forty",
  "Drum Roll Please",
  "Boatmens Birthday Brigade",
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const name = item.replace(/\s+/g, " ").trim();
    if (!name || name.length > 60) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length >= 5) break;
  }
  return names;
}

function fallbackSuggestions(hint?: string): TeamNameSuggestions {
  let pool = FALLBACK_NAMES;
  const trimmed = hint?.trim();
  if (trimmed) {
    const word = trimmed.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9']/g, "");
    if (word && word.length >= 2) {
      pool = [
        `${word} & the Reels`,
        `Team ${word}`,
        `${word}'s Cast Party`,
        `Hooked on ${word}`,
        ...FALLBACK_NAMES,
      ];
    }
  }
  return {
    names: shuffle(pool).slice(0, 5),
    provider: "fallback",
  };
}

/**
 * Suggest fun fishing-tournament team names via OpenAI.
 * Falls back to a local list when no API key is set or the call fails.
 */
export async function suggestTeamNames(options?: {
  hint?: string;
  avoid?: string[];
}): Promise<TeamNameSuggestions> {
  const hint = options?.hint?.trim().slice(0, 200) || undefined;
  const avoid = (options?.avoid ?? [])
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 20);

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return fallbackSuggestions(hint);
  }

  try {
    const avoidLine =
      avoid.length > 0
        ? ` Do not repeat these names: ${avoid.join("; ")}.`
        : "";
    const hintLine = hint
      ? ` Incorporate this vibe or detail from the team: "${hint}".`
      : "";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEAM_NAME_MODEL?.trim() ||
          process.env.OPENAI_VISION_MODEL?.trim() ||
          "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.95,
        messages: [
          {
            role: "system",
            content:
              `You invent short, catchy team names for "${EVENT.name}" on ${EVENT.dateLabel} in ${EVENT.city} (Texas Gulf Coast / Rockport fishing). Mix puns, birthday energy, and fishing slang (reel, hook, cast, reds, speck, drum, bay, boat). Keep each name under 40 characters, PG-rated, and easy to say aloud. Respond ONLY with JSON: {"names":string[]} with exactly 5 unique names.`,
          },
          {
            role: "user",
            content: `Suggest 5 team names.${hintLine}${avoidLine}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("OpenAI team name suggestions failed", res.status, detail);
      return fallbackSuggestions(hint);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackSuggestions(hint);
    }

    const parsed = JSON.parse(content) as AiJson;
    const names = normalizeNames(parsed.names);
    if (names.length < 3) {
      return fallbackSuggestions(hint);
    }

    return { names, provider: "openai" };
  } catch (err) {
    console.error("Team name AI error", err);
    return fallbackSuggestions(hint);
  }
}
