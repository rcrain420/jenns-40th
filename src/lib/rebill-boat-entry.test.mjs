import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { amountDueCents, BOAT_ENTRY_CENTS } from "./config.ts";
import { planBoatEntryRebill } from "./rebill-boat-entry.ts";

describe("planBoatEntryRebill", () => {
  it("rebills teams with fewer than 4 roster seats to $300 + side pots", () => {
    const plans = planBoatEntryRebill([
      {
        id: "two-adults",
        teamName: "Bay Pair",
        amountDueCents: 15000,
        paymentStatus: "PAID",
        sidePotCount: 0,
        anglerCount: 2,
      },
      {
        id: "three-plus-pot",
        teamName: "Trout Trio",
        amountDueCents: 27500,
        paymentStatus: "UNPAID",
        sidePotCount: 1,
        anglerCount: 3,
      },
    ]);

    assert.deepEqual(
      plans.map((plan) => ({
        id: plan.id,
        nextDueCents: plan.nextDueCents,
        paymentStatus: plan.paymentStatus,
        reason: plan.reason,
      })),
      [
        {
          id: "two-adults",
          nextDueCents: BOAT_ENTRY_CENTS,
          paymentStatus: "PAID",
          reason: "under-four",
        },
        {
          id: "three-plus-pot",
          nextDueCents: amountDueCents(1),
          paymentStatus: "UNPAID",
          reason: "under-four",
        },
      ],
    );
  });

  it("skips 4-angler teams already at $300 + side pots", () => {
    const plans = planBoatEntryRebill([
      {
        id: "full-boat",
        teamName: "Full House",
        amountDueCents: 30000,
        paymentStatus: "PAID",
        sidePotCount: 0,
        anglerCount: 4,
      },
      {
        id: "full-plus-pots",
        teamName: "All In",
        amountDueCents: 45000,
        paymentStatus: "UNPAID",
        sidePotCount: 3,
        anglerCount: 4,
      },
    ]);
    assert.deepEqual(plans, []);
  });

  it("aligns a 4-seat youth boat that was billed under old per-adult math", () => {
    const [plan] = planBoatEntryRebill([
      {
        id: "youth-four",
        teamName: "Family Boat",
        amountDueCents: 15000,
        paymentStatus: "PAID",
        sidePotCount: 0,
        anglerCount: 4,
      },
    ]);
    assert.equal(plan.nextDueCents, BOAT_ENTRY_CENTS);
    assert.equal(plan.paymentStatus, "PAID");
    assert.equal(plan.reason, "align-formula");
  });
});
