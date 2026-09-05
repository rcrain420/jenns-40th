/** Soft copy when the registrant is the boat contact, not a $75 seat. */

export function boatContactNotAnglerNudge(feeLabel: string): string {
  return `You’re the boat contact — add yourself as an angler if you’re fishing (${feeLabel}).`;
}
