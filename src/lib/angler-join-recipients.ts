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

function normalizedEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

/**
 * Prior roster rows. Admin edit selects email only; the name is unused
 * when deciding who was already on the boat.
 */
export type PreviousJoinAngler = {
  email?: string | null;
};

/**
 * Admin edit recipients. Only adult seats whose email was not already on
 * the roster. Already-joined team members are dropped when their emails
 * are passed in. Youth, blank, and duplicate emails stay out.
 */
export function anglersNewlyAddedForJoinInvite<T extends JoinInviteAngler>(input: {
  previous: readonly PreviousJoinAngler[];
  next: readonly T[];
  joinedEmails?: readonly string[];
}): Array<T & { email: string }> {
  const previousEmails = new Set<string>();
  for (const angler of input.previous) {
    const email = normalizedEmail(angler.email);
    if (email) previousEmails.add(email);
  }
  const joined = new Set<string>();
  for (const email of input.joinedEmails ?? []) {
    const normalized = normalizedEmail(email);
    if (normalized) joined.add(normalized);
  }
  const fresh = input.next.filter((angler) => {
    const email = normalizedEmail(angler.email);
    if (!email || previousEmails.has(email) || joined.has(email)) return false;
    return true;
  });
  return emailedAnglersForJoinInvite(fresh);
}
