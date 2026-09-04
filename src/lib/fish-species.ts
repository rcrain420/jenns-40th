/**
 * Livewell vision estimates are locked to Rockport / Texas Gulf species
 * Aaron wants on the board. The model must not invent freeform labels
 * like "unidentified gulf fish".
 */

export const UNKNOWN_FISH_BREED = "Unknown" as const;

/** Display names stored on the catch and shown in the Livewell / Brag Board. */
export const ALLOWED_FISH_BREEDS = [
  "Redfish",
  "Trout",
  "Black drum",
  "Hardhead catfish",
  "Gafftop",
] as const;

export const FISH_ESTIMATE_BREEDS = [
  ...ALLOWED_FISH_BREEDS,
  UNKNOWN_FISH_BREED,
] as const;

export type AllowedFishBreed = (typeof ALLOWED_FISH_BREEDS)[number];
export type FishEstimateBreed = (typeof FISH_ESTIMATE_BREEDS)[number];

/** Tournament stringer species — prefer these only when the photo is a toss-up. */
export const TOURNAMENT_FISH_BREEDS = ["Redfish", "Trout"] as const;

const BREED_ALIASES: Record<FishEstimateBreed, readonly string[]> = {
  Redfish: [
    "redfish",
    "red fish",
    "red drum",
    "reddrum",
    "sciaenops ocellatus",
    "sciaenops",
    "bull red",
    "rat red",
    "slot red",
  ],
  Trout: [
    "trout",
    "speckled trout",
    "speckle trout",
    "spotted seatrout",
    "spotted sea trout",
    "seatrout",
    "sea trout",
    "specks",
    "speck",
    "speckled",
    "cynoscion nebulosus",
    "cynoscion",
  ],
  "Black drum": [
    "black drum",
    "blackdrum",
    "pogonias cromis",
    "pogonias",
  ],
  "Hardhead catfish": [
    "hardhead catfish",
    "hard head catfish",
    "hardhead cat",
    "hard head cat",
    "hardhead",
    "hard head",
    "ariopsis felis",
    "ariopsis",
  ],
  Gafftop: [
    "gafftop",
    "gaff top",
    "gafftopsail",
    "gaff topsail",
    "gafftopsail catfish",
    "gaff topsail catfish",
    "gafftop catfish",
    "gaff top catfish",
    "sail cat",
    "sailcat",
    "bagre marinus",
    "bagre",
  ],
  Unknown: [
    "unknown",
    "unidentified",
    "unidentified fish",
    "unidentified gulf fish",
    "not a fish",
    "unusable",
    "n a",
    "none",
    "skip",
  ],
};

type AliasHit = { breed: FishEstimateBreed; alias: string };

const ALIAS_HITS: AliasHit[] = (
  Object.entries(BREED_ALIASES) as [FishEstimateBreed, readonly string[]][]
)
  .flatMap(([breed, aliases]) =>
    aliases.map((alias) => ({ breed, alias: foldSpeciesText(alias) })),
  )
  .sort((a, b) => b.alias.length - a.alias.length);

export function foldSpeciesText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function aliasMatches(folded: string, alias: string): boolean {
  if (!alias) return false;
  if (folded === alias) return true;
  return folded.startsWith(`${alias} `) || folded.endsWith(` ${alias}`) ||
    folded.includes(` ${alias} `);
}

/**
 * Map a model or stored breed string onto the allowed set.
 * Unknown species (flounder, sheepshead, freeform gulf labels) become Unknown —
 * never remapped to a tournament fish.
 */
export function normalizeFishBreed(raw: unknown): FishEstimateBreed {
  if (typeof raw !== "string" || !raw.trim()) return UNKNOWN_FISH_BREED;

  const folded = foldSpeciesText(raw);
  if (!folded) return UNKNOWN_FISH_BREED;

  for (const breed of FISH_ESTIMATE_BREEDS) {
    if (folded === foldSpeciesText(breed)) return breed;
  }

  for (const hit of ALIAS_HITS) {
    if (aliasMatches(folded, hit.alias)) return hit.breed;
  }

  return UNKNOWN_FISH_BREED;
}

export function isFishEstimateBreed(value: string): value is FishEstimateBreed {
  return (FISH_ESTIMATE_BREEDS as readonly string[]).includes(value);
}

export const FISH_ESTIMATE_SYSTEM_PROMPT = [
  "You identify Rockport / Texas Gulf inshore fish from a catch photo for a tournament Livewell.",
  "breed MUST be exactly one of these display names and nothing else:",
  "- Redfish (red drum) — tournament fish",
  "- Trout (speckled / spotted seatrout) — tournament fish",
  "- Black drum",
  "- Hardhead catfish (hardhead)",
  "- Gafftop (gafftopsail catfish)",
  "- Unknown",
  "Never output other species names, scientific-only names, or freeform labels such as \"unidentified gulf fish\", flounder, sheepshead, or mackerel.",
  "If the photo is not a fish, empty, too blurry to use, or clearly some other animal, set breed to Unknown and say why in notes.",
  "When the photo is a toss-up between a tournament fish (Redfish or Trout) and a non-tournament lookalike, prefer Redfish or Trout.",
  "Do not invent Redfish or Trout when the photo clearly shows Black drum (chin barbels, deep body, juvenile bars), Hardhead catfish, or Gafftop (long sail-like fins / long barbels).",
  "Keep lengthInches and weightLbs as numeric guesses even when breed is Unknown. Use a hand, lure, or deck for scale when visible.",
  "confidence is 0-1 for the species call. notes: short Texas-angler language; no secrets or env var names.",
  'Respond ONLY with JSON: {"breed":string,"lengthInches":number,"weightLbs":number,"confidence":number,"notes":string}.',
].join(" ");

export const FISH_ESTIMATE_USER_PROMPT =
  "Estimate this catch. breed must be exactly one of: Redfish, Trout, Black drum, Hardhead catfish, Gafftop, or Unknown. Use any visible scale, lure, hand, or deck for size reference if present.";

/** OpenAI structured-output schema — breed is an enum, not free text. */
export const FISH_ESTIMATE_JSON_SCHEMA = {
  name: "fish_estimate",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["breed", "lengthInches", "weightLbs", "confidence", "notes"],
    properties: {
      breed: {
        type: "string",
        enum: [...FISH_ESTIMATE_BREEDS],
        description:
          "Exactly one allowed Rockport display name, or Unknown if not a usable fish photo.",
      },
      lengthInches: { type: "number" },
      weightLbs: { type: "number" },
      confidence: { type: "number" },
      notes: { type: "string" },
    },
  },
} as const;

export function fishEstimateChatBody(imageUrl: string, model: string) {
  return {
    model,
    response_format: {
      type: "json_schema" as const,
      json_schema: FISH_ESTIMATE_JSON_SCHEMA,
    },
    temperature: 0.2,
    messages: [
      {
        role: "system" as const,
        content: FISH_ESTIMATE_SYSTEM_PROMPT,
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: FISH_ESTIMATE_USER_PROMPT,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: imageUrl,
              detail: "low" as const,
            },
          },
        ],
      },
    ],
  };
}
