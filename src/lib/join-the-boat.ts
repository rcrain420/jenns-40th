/**
 * Product contract 2026-08-28 (Aaron): Join the boat is not magic
 * sign-in and is not a paid Angler seat.
 *
 * First tap shows Create account (invitee email prefilled) on the same
 * Google / Facebook / email form used everywhere else. After they set a
 * password — or continue with Google / Facebook — they are on that boat
 * — name on the roster, Joined, full Livewell, not captain. Later visits
 * use that same sign-in. Youth seats stay name-only / parent login.
 *
 * The boat lists every invited adult as Joined or Pending. Name-only
 * seats stay name-only / not emailed. Youth seats are parent-login
 * and never pending create-account.
 *
 * Leaf module so Node tests can import it without extension rewriting.
 */
export const JOIN_THE_BOAT = {
  firstTap: "create-account",
  silentUserSession: false,
  authMode: "signup",
  makesCaptain: false,
  addsPaidRoster: false,
} as const;

export type BoatRosterStatus = "joined" | "pending" | "name-only" | "youth";

export type BoatRosterRow = {
  name: string;
  email: string | null;
  status: BoatRosterStatus;
};

export function joinTheBoatAuthMode(): "signup" {
  return JOIN_THE_BOAT.authMode;
}

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase() ?? "";
  return trimmed.includes("@") ? trimmed : null;
}

/** Derive the boat list from paid seats + accounts that finished join. */
export function buildBoatRoster(input: {
  anglers: Array<{
    fullName: string;
    email?: string | null;
    isYouth?: boolean | null;
  }>;
  members: Array<{ name: string; email: string }>;
}): BoatRosterRow[] {
  const memberByEmail = new Map<string, { name: string; email: string }>();
  for (const member of input.members) {
    const email = normalizeEmail(member.email);
    if (email) memberByEmail.set(email, { ...member, email });
  }

  const used = new Set<string>();
  const rows: BoatRosterRow[] = [];

  for (const angler of input.anglers) {
    const email = normalizeEmail(angler.email);
    if (angler.isYouth) {
      rows.push({
        name: angler.fullName,
        email,
        status: "youth",
      });
      continue;
    }
    if (!email) {
      rows.push({
        name: angler.fullName,
        email: null,
        status: "name-only",
      });
      continue;
    }
    used.add(email);
    rows.push({
      name: angler.fullName,
      email,
      status: memberByEmail.has(email) ? "joined" : "pending",
    });
  }

  for (const member of input.members) {
    const email = normalizeEmail(member.email);
    if (!email || used.has(email)) continue;
    rows.push({
      name: member.name,
      email,
      status: "joined",
    });
  }

  return rows;
}

export function boatRosterStatusLabel(status: BoatRosterStatus): string {
  if (status === "joined") return "Joined";
  if (status === "pending") return "Pending";
  if (status === "youth") return "Youth · parent login";
  return "Name-only · not emailed";
}

export type DirectoryAngler = {
  name: string;
  status: BoatRosterStatus;
  statusLabel: string | null;
};

export type DirectoryTeam = {
  id: string;
  teamName: string;
  isOwn: boolean;
  anglers: DirectoryAngler[];
};

/** Joined/Pending when we already track them. Youth label is existing, not new. */
export function directoryStatusLabel(
  status: BoatRosterStatus,
): string | null {
  if (status === "joined" || status === "pending" || status === "youth") {
    return boatRosterStatusLabel(status);
  }
  return null;
}

export function toDirectoryTeam(input: {
  id: string;
  teamName: string;
  ownTeamId?: string | null;
  anglers: Array<{
    fullName: string;
    email?: string | null;
    isYouth?: boolean | null;
  }>;
  members: Array<{ name: string; email: string }>;
}): DirectoryTeam {
  const rows = buildBoatRoster({
    anglers: input.anglers,
    members: input.members,
  });
  return {
    id: input.id,
    teamName: input.teamName,
    isOwn: Boolean(input.ownTeamId && input.id === input.ownTeamId),
    anglers: rows.map((row) => ({
      name: row.name,
      status: row.status,
      statusLabel: directoryStatusLabel(row.status),
    })),
  };
}
