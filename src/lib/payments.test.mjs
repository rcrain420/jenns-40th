import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { centsToUsdInput, parseUsdToCents } from "./money.ts";
import {
  adminPaymentStats,
  derivePaymentStatus,
  MARK_FULLY_PAID_NOTE,
  MIGRATED_PAID_NOTE,
  paymentBalanceCents,
  paymentStatusLabel,
  remainingBalanceCents,
} from "./payments.ts";

describe("derivePaymentStatus", () => {
  it("is UNPAID when nothing is paid and due is positive", () => {
    assert.equal(derivePaymentStatus(0, 35000), "UNPAID");
  });

  it("is PARTIAL when 0 < paid < due", () => {
    assert.equal(derivePaymentStatus(5000, 35000), "PARTIAL");
    assert.equal(derivePaymentStatus(34999, 35000), "PARTIAL");
  });

  it("is PAID when paid meets or exceeds due", () => {
    assert.equal(derivePaymentStatus(35000, 35000), "PAID");
    assert.equal(derivePaymentStatus(40000, 35000), "PAID");
  });

  it("is PAID when due is zero even with an empty ledger", () => {
    assert.equal(derivePaymentStatus(0, 0), "PAID");
  });
});

describe("payment balances", () => {
  it("allows overpay and reports a negative balance", () => {
    assert.equal(paymentBalanceCents(35000, 40000), -5000);
    assert.equal(remainingBalanceCents(35000, 40000), 0);
  });

  it("treats a $50 payment on a $350 boat as $300 remaining", () => {
    assert.equal(remainingBalanceCents(35000, 5000), 30000);
    assert.equal(paymentBalanceCents(35000, 5000), 30000);
  });
});

describe("adminPaymentStats", () => {
  it("sums actual paid cents and remaining balances", () => {
    const stats = adminPaymentStats([
      { amountDueCents: 35000, amountPaidCents: 5000 },
      { amountDueCents: 30000, amountPaidCents: 40000 },
      { amountDueCents: 0, amountPaidCents: 0 },
    ]);
    assert.equal(stats.collectedCents, 45000);
    assert.equal(stats.outstandingCents, 30000);
  });
});

describe("payment labels and migration copy", () => {
  it("labels the three derived statuses", () => {
    assert.equal(paymentStatusLabel("PAID"), "Paid");
    assert.equal(paymentStatusLabel("PARTIAL"), "Partial");
    assert.equal(paymentStatusLabel("UNPAID"), "Unpaid");
  });

  it("keeps migration and mark-paid notes stable", () => {
    assert.equal(MIGRATED_PAID_NOTE, "Migrated: previously marked paid");
    assert.equal(MARK_FULLY_PAID_NOTE, "Marked fully paid");
  });
});

describe("dollar input", () => {
  it("parses whole and fractional dollars to cents", () => {
    assert.equal(parseUsdToCents("50"), 5000);
    assert.equal(parseUsdToCents("150.00"), 15000);
    assert.equal(parseUsdToCents("400.5"), 40050);
    assert.equal(parseUsdToCents("0"), null);
    assert.equal(parseUsdToCents("-10"), null);
    assert.equal(parseUsdToCents("abc"), null);
  });

  it("formats cents back to a compact dollar input", () => {
    assert.equal(centsToUsdInput(5000), "50");
    assert.equal(centsToUsdInput(5050), "50.50");
  });
});
