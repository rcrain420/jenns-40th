/** Captain and DIY contact are optional on create and later on My team. */
export const CAPTAIN_REQUIRED_ON_CREATE = false;

export function contactEmailIssue(email?: string | null): string | null {
  const trimmed = email?.trim();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Valid contact email required";
  }
  return null;
}
