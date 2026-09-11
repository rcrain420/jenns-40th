export const PAYMENT_SOURCE = {
  MANUAL: "MANUAL",
  VENMO: "VENMO",
} as const;

export type PaymentSource =
  (typeof PAYMENT_SOURCE)[keyof typeof PAYMENT_SOURCE];

export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const MIGRATED_PAID_NOTE = "Migrated: previously marked paid";
export const MARK_FULLY_PAID_NOTE = "Marked fully paid";

export function derivePaymentStatus(
  amountPaidCents: number,
  amountDueCents: number,
): PaymentStatus {
  if (amountDueCents <= 0 || amountPaidCents >= amountDueCents) {
    return PAYMENT_STATUS.PAID;
  }
  if (amountPaidCents <= 0) return PAYMENT_STATUS.UNPAID;
  return PAYMENT_STATUS.PARTIAL;
}

/** Remaining balance; negative when overpaid. */
export function paymentBalanceCents(
  amountDueCents: number,
  amountPaidCents: number,
): number {
  return amountDueCents - amountPaidCents;
}

export function remainingBalanceCents(
  amountDueCents: number,
  amountPaidCents: number,
): number {
  return Math.max(0, amountDueCents - amountPaidCents);
}

/**
 * Admin dashboard totals:
 * - Collected = sum of actual amountPaidCents (includes overpayments).
 * - Outstanding = sum of max(0, due − paid).
 */
export function adminPaymentStats(
  teams: Array<{ amountDueCents: number; amountPaidCents: number }>,
): { collectedCents: number; outstandingCents: number } {
  return {
    collectedCents: teams.reduce((sum, team) => sum + team.amountPaidCents, 0),
    outstandingCents: teams.reduce(
      (sum, team) =>
        sum + remainingBalanceCents(team.amountDueCents, team.amountPaidCents),
      0,
    ),
  };
}

export function paymentStatusLabel(status: string): string {
  if (status === PAYMENT_STATUS.PAID) return "Paid";
  if (status === PAYMENT_STATUS.PARTIAL) return "Partial";
  return "Unpaid";
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (
    value === PAYMENT_STATUS.UNPAID ||
    value === PAYMENT_STATUS.PARTIAL ||
    value === PAYMENT_STATUS.PAID
  );
}
