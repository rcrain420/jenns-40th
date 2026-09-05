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
 * The boat lists every invited adult as Angler · Joined or
 * Angler · Pending. Name-only seats stay name-only / not emailed.
 * Youth seats are parent-login and never pending create-account.
 * Accounts that joined the boat but are not on the paid Angler roster
 * (parent / registrant / share-link) are Boat account — not a $75 seat.
 *
 * Product contract 2026-09-05 (Aaron): four invited anglers lock the
 * boat. Pending, youth, and name-only official seats count. Extra
 * joiners from the share link count. Captain is not a seat. A pending
 * adult may still finish join — that fills their existing seat.
 *
 * Leaf module so Node tests can import it without extension rewriting.
 * Invite cap matches config.MAX_ANGLERS (kept local — no config import).
 */
const MAX_ANGLERS = 4;

export const JOIN_THE_BOAT = {
  firstTap: "create-account",
  silentUserSession: false,
  authMode: "signup",
  makesCaptain: false,
  addsPaidRoster: false,
} as const;

export type BoatRosterStatus =
  | "joined"
  | "pending"
  | "name-only"
  | "youth"
  | "boat-account";

export type BoatRosterRow = {
  name: string;
  email: string | null;
  status: BoatRosterStatus;
};

export type BoatRosterInput = {
  anglers: Array<{
    fullName: string;
    email?: string | null;
    isYouth?: boolean | null;
  }>;
  members: Array<{ name: string; email: string }>;
};

export const BOAT_FULL_MESSAGE = `This boat is full (${MAX_ANGLERS}/${MAX_ANGLERS}).`;
export const BOAT_FULL_NOTE = `Boat is full (${MAX_ANGLERS}/${MAX_ANGLERS}).`;

export function joinTheBoatAuthMode(): "signup" {
  return JOIN_THE_BOAT.authMode;
}

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase() ?? "";
  return trimmed.includes("@") ? trimmed : null;
}

/** Derive the boat list from paid seats + accounts that finished join. */
export function buildBoatRoster(input: BoatRosterInput): BoatRosterRow[] {
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
      status: "boat-account",
    });
  }

  return rows;
}

export function boatRosterStatusLabel(status: BoatRosterStatus): string {
  if (status === "joined") return "Angler · Joined";
  if (status === "pending") return "Angler · Pending";
  if (status === "youth") return "Youth · parent login";
  if (status === "boat-account") return "Boat account";
  return "Name-only · not emailed";
}

/** Paid fishing seats, including youth. Boat-only accounts are not seats. */
export function isOfficialAnglerSeat(status: BoatRosterStatus): boolean {
  return status !== "boat-account";
}

export type DirectoryAngler = {
  name: string;
  status: BoatRosterStatus;
  statusLabel: string | null;
  isYouth: boolean;
  isAnglerSeat: boolean;
};

export type DirectoryTeam = {
  id: string;
  teamName: string;
  isOwn: boolean;
  anglers: DirectoryAngler[];
};

/**
 * Teams official-roster labels. Adult seats say Angler so they do not
 * look like boat-only accounts. Name-only adults are still $75 seats.
 */
export function directoryStatusLabel(
  status: BoatRosterStatus,
): string | null {
  if (status === "name-only") return "Angler";
  if (
    status === "joined" ||
    status === "pending" ||
    status === "youth" ||
    status === "boat-account"
  ) {
    return boatRosterStatusLabel(status);
  }
  return null;
}

function normalizePersonName(name: string | null | undefined): string | null {
  const trimmed = name?.trim().toLowerCase() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * True when this person already occupies a paid adult Angler seat
 * (email match, or exact full-name match for name-only seats).
 */
export function isListedAsAdultAngler(
  anglers: BoatRosterInput["anglers"],
  identity: { email?: string | null; name?: string | null },
): boolean {
  if (joinFillsExistingSeat({ anglers, members: [] }, identity.email)) {
    return true;
  }
  const name = normalizePersonName(identity.name);
  if (!name) return false;
  return anglers.some(
    (angler) =>
      angler.isYouth !== true &&
      normalizePersonName(angler.fullName) === name,
  );
}

/** Registrant / boat contact who is not a paid adult Angler seat. */
export function isBoatContactNotAngler(
  anglers: BoatRosterInput["anglers"],
  identity: { email?: string | null; name?: string | null },
): boolean {
  return !isListedAsAdultAngler(anglers, identity);
}

export function toDirectoryTeam(input: {
  id: string;
  teamName: string;
  ownTeamId?: string | null;
  anglers: BoatRosterInput["anglers"];
  members: BoatRosterInput["members"];
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
      isYouth: row.status === "youth",
      isAnglerSeat: isOfficialAnglerSeat(row.status),
    })),
  };
}

/** Seats that count toward the 4-angler invite cap, including Pending. */
export function invitedAnglerCount(input: BoatRosterInput): number {
  return buildBoatRoster(input).length;
}

export function isBoatInviteLocked(input: BoatRosterInput): boolean {
  return invitedAnglerCount(input) >= MAX_ANGLERS;
}

/**
 * True when this email already occupies an official adult seat.
 * Youth emails do not count — joining would add a new On this boat row.
 */
export function joinFillsExistingSeat(
  input: BoatRosterInput,
  joinerEmail?: string | null,
): boolean {
  const email = normalizeEmail(joinerEmail);
  if (!email) return false;
  return input.anglers.some(
    (angler) => !angler.isYouth && normalizeEmail(angler.email) === email,
  );
}

export function canJoinBoat(
  input: BoatRosterInput,
  joinerEmail?: string | null,
): boolean {
  return joinFillsExistingSeat(input, joinerEmail) || !isBoatInviteLocked(input);
}

/** Reject roster growth past 4 without blocking saves on already-over boats. */
export function rosterWouldExceedInviteCapacity(input: {
  current: BoatRosterInput;
  nextAnglers: BoatRosterInput["anglers"];
}): boolean {
  const currentCount = invitedAnglerCount(input.current);
  const nextCount = invitedAnglerCount({
    anglers: input.nextAnglers,
    members: input.current.members,
  });
  return nextCount > MAX_ANGLERS && nextCount > currentCount;
}
