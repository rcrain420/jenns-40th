export type JoinInviteAngler = {
  fullName: string;
  email?: string | null;
};

/** Seats with an email get Join the boat. Name-only seats stay on PIN / shared link. */
export function emailedAnglersForJoinInvite<T extends JoinInviteAngler>(
  anglers: T[],
): Array<T & { email: string }> {
  const seen = new Set<string>();
  const recipients: Array<T & { email: string }> = [];
  for (const angler of anglers) {
    const email = angler.email?.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ ...angler, email });
  }
  return recipients;
}
