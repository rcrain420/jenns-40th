import { formatUsd } from "./money.ts";
import { formatInches } from "./weigh-scoring.ts";

/** One stored jar guess. `createdAt` is when it was submitted. */
export type LineJarGuessRecord = {
  id: string;
  name: string;
  guessedLengthInches: number;
  donationCents: number;
  paid: boolean;
  createdAt: Date;
};

export type LineJarGuessView = {
  id: string;
  name: string;
  guessedLength: string;
  donation: string;
  paid: boolean;
  paidLabel: "Paid" | "Unpaid";
  submitted: string;
};

/**
 * Newest submission first. Same timestamp keeps a deterministic order
 * by id descending so a refresh does not shuffle ties.
 */
export function orderLineJarGuessesNewestFirst<
  T extends { id: string; createdAt: Date },
>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    const byTime = b.createdAt.getTime() - a.createdAt.getTime();
    if (byTime !== 0) return byTime;
    if (a.id === b.id) return 0;
    return a.id < b.id ? 1 : -1;
  });
}

export function lineJarPaidLabel(paid: boolean): "Paid" | "Unpaid" {
  return paid ? "Paid" : "Unpaid";
}

/** Rockport is America/Chicago. Include the date so multi-day entries stay distinct. */
export function formatLineJarSubmitted(date: Date): string {
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function toLineJarGuessView(row: LineJarGuessRecord): LineJarGuessView {
  return {
    id: row.id,
    name: row.name,
    guessedLength: formatInches(row.guessedLengthInches),
    donation: formatUsd(row.donationCents),
    paid: row.paid,
    paidLabel: lineJarPaidLabel(row.paid),
    submitted: formatLineJarSubmitted(row.createdAt),
  };
}
