/** True when the Livewell should show AI inches / pounds (not a fallback stamp). */
export function catchHasAiSize(input: {
  aiProvider?: string | null;
  lengthInches?: number | null;
  weightLbs?: number | null;
}): boolean {
  if (input.aiProvider === "fallback") return false;
  return input.lengthInches != null || input.weightLbs != null;
}

export function formatCatchSizeLine(input: {
  aiProvider?: string | null;
  lengthInches?: number | null;
  weightLbs?: number | null;
}): string {
  if (!catchHasAiSize(input)) return "Size not estimated";
  const parts: string[] = [];
  if (input.lengthInches != null) parts.push(`${input.lengthInches}"`);
  if (input.weightLbs != null) parts.push(`${input.weightLbs} lb`);
  return parts.join(" · ");
}
