export const EVENT = {
  name: "Official-ish Fishing Tournament for Jenn's 40th Birthday",
  shortName: "Jenn's 40th",
  brandNav: "OFFICIAL-ISH FISHING TOURNAMENT",
  heroScriptTop: "Official-ish",
  heroDisplay: "Fishing Tournament",
  heroScriptBottom: "",
  heroKicker: "Jenn's 40th Birthday Bay Bash",
  dateLabel: "October 9–10, 2026",
  dateBand: "OCTOBER 9–10, 2026",
  fridayLabel: "Friday, Oct 9",
  saturdayLabel: "Saturday, Oct 10",
  locationLabel: "Rockport, TX · Boatmen’s Club Bar & Marina",
  venue: "Boatmen’s Club Bar & Marina",
  address: "140 Cove Harbor N, Rockport, TX 78382",
  phone: "(361) 223-9459",
  phoneTel: "+13612239459",
  city: "Rockport, Texas",
  tagline: "Good friends ★ Tight lines ★ Great memories",
  footerScript: "See you in Rockport!",
  /** Lines in / captain's day start — America/Chicago */
  countdownTargetIso: "2026-10-09T12:00:00.000Z",
  directionsUrl:
    "https://www.google.com/maps/search/?api=1&query=Boatmen%27s+Club+Bar+%26+Marina+140+Cove+Harbor+N+Rockport+TX+78382",
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=-97.085%2C28.015%2C-97.045%2C28.045&layer=mapnik&marker=28.030%2C-97.065",
} as const;

/** Registration closes at end of day (America/Chicago) Oct 1, 2026 */
export const REGISTRATION_CLOSES_AT = new Date("2026-10-02T05:00:00.000Z");

export const MAX_TEAMS = 25;
export const MIN_ANGLERS = 2;
export const MAX_ANGLERS = 4;
export const FEE_PER_ANGLER_CENTS = 7500;

/** Optional paid side pots — $50 per team, per pot. */
export const SIDE_POT_BUY_IN_CENTS = 5000;

export const PAID_SIDE_POTS = [
  { id: "trout", name: "Heaviest spotted seatrout", noteLabel: "heaviest trout" },
  { id: "blackjack", name: "Blackjack redfish", noteLabel: "blackjack redfish" },
  { id: "spots", name: "Most spots", noteLabel: "most spots" },
] as const;

export type SidePotId = (typeof PAID_SIDE_POTS)[number]["id"];

export const SIDE_POT_IDS = PAID_SIDE_POTS.map((p) => p.id) as [
  SidePotId,
  ...SidePotId[],
];

/** Host-funded prizes. Listed at $0. Never stored on Team.sidePots. */
export const HOST_FUNDED_POTS = [
  {
    id: "kids",
    name: "Kids pot (Rowan & Rider)",
    buyInCents: 0,
    buyInLabel: "Free",
    href: "/kids",
  },
  {
    id: "catfish",
    name: "Heaviest saltwater catfish",
    buyInCents: 0,
    buyInLabel: "Free",
    href: undefined,
  },
] as const;

export type HostFundedPotId = (typeof HOST_FUNDED_POTS)[number]["id"];

export type ListedPot = {
  id: string;
  name: string;
  buyInCents: number;
  buyInLabel: string;
  hostFunded: boolean;
  href?: string;
};

/** Paid side pots plus host prizes (kids pot and catfish at $0). */
export function listedPots(): ListedPot[] {
  return [
    ...PAID_SIDE_POTS.map((pot) => ({
      id: pot.id,
      name: pot.name,
      buyInCents: SIDE_POT_BUY_IN_CENTS,
      buyInLabel: `$${(SIDE_POT_BUY_IN_CENTS / 100).toFixed(0)}`,
      hostFunded: false,
    })),
    ...HOST_FUNDED_POTS.map((pot) => ({
      id: pot.id,
      name: pot.name,
      buyInCents: pot.buyInCents,
      buyInLabel: pot.buyInLabel,
      hostFunded: true,
      href: pot.href,
    })),
  ];
}

/** Main tournament pot payout split. */
export const MAIN_POT_SPLITS = [
  { place: "1st", pct: 50 },
  { place: "2nd", pct: 30 },
  { place: "3rd", pct: 20 },
] as const;

/** Venmo username for registration payments. Display and /u/ path. */
export const VENMO_USERNAME = "Jennski";
export const VENMO_HANDLE = VENMO_USERNAME;

export function getVenmoUrl(): string {
  const override = process.env.VENMO_URL?.trim();
  if (override) return override;
  return `https://venmo.com/u/${VENMO_USERNAME}`;
}

/** Deep link that opens Venmo to pay (works well on mobile). */
export function getVenmoPayUrl(opts?: {
  amountCents?: number;
  note?: string;
}): string {
  const override = process.env.VENMO_URL?.trim();
  if (override) return override;

  const params = new URLSearchParams({
    txn: "pay",
    audience: "private",
    recipients: VENMO_USERNAME,
  });
  if (opts?.amountCents != null && opts.amountCents > 0) {
    params.set("amount", (opts.amountCents / 100).toFixed(2));
  }
  if (opts?.note?.trim()) {
    params.set("note", opts.note.trim());
  }
  return `https://venmo.com/?${params.toString()}`;
}

/** Canonical public origin for emails, metadata, and magic links. */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return new URL(explicit).origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://officialishfishingtournament.com";
}

/** Paid adult seats only. Youth (`isYouth`) are roster seats, not $75 entries. */
export function paidEntrySeatCount(
  anglers: Array<{ isYouth?: boolean | null }>,
): number {
  return anglers.filter((angler) => angler.isYouth !== true).length;
}

export function isRegistrationOpen(now = new Date()): boolean {
  return now.getTime() < REGISTRATION_CLOSES_AT.getTime();
}

export function amountDueCents(
  anglersOrPaidCount: Array<{ isYouth?: boolean | null }> | number,
  sidePotCount = 0,
): number {
  const paidCount =
    typeof anglersOrPaidCount === "number"
      ? anglersOrPaidCount
      : paidEntrySeatCount(anglersOrPaidCount);
  return (
    FEE_PER_ANGLER_CENTS * paidCount + SIDE_POT_BUY_IN_CENTS * sidePotCount
  );
}

export function remainingUntil(
  target: Date,
  now = new Date(),
): { days: number; hours: number; minutes: number; seconds: number; totalMs: number } {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
}
