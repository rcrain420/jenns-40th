export type JoinInviteAngler = {
  fullName: string;
  email?: string | null;
  isYouth?: boolean | null;
};

/** Adult seats with an email get Join the boat. Youth seats never get a create-account invite. */
export function emailedAnglersForJoinInvite<T extends JoinInviteAngler>(
  anglers: T[],
): Array<T & { email: string }> {
  const seen = new Set<string>();
  const recipients: Array<T & { email: string }> = [];
  for (const angler of anglers) {
    if (angler.isYouth) continue;
    const email = angler.email?.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ ...angler, email });
  }
  return recipients;
}
