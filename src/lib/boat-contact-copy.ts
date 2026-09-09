/** Soft copy when the registrant is the boat contact, not a fishing seat. */

export function boatContactNotAnglerNudge(feeLabel: string): string {
  return `You’re the boat contact — add yourself as an angler if you’re fishing. That does not change the ${feeLabel} boat entry.`;
}
