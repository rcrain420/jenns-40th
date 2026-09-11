import { prisma } from "./db";
import {
  ENTRY_KIND,
  MAX_TEAMS,
  amountDueCents,
  amountDueForEntry,
  isRegistrationOpen,
} from "./config";
import { derivePaymentStatus } from "./payments";
import { normalizeUnlockEmail } from "./event-unlock-token";
import {
  PUBLIC_REGISTRATION_DATE_CLOSED_ERROR,
  publicCreateBlockedReason,
} from "./registration-policy";
import { ensureTeamMember } from "./team-invite";
import type { RegistrationInput, YouthLandRegistrationInput } from "./validation";

/** Paid boat entries only — a YOUTH_LAND / RowRide entry does not consume a boat slot. */
export async function getTeamCount(): Promise<number> {
  return prisma.team.count({ where: { entryKind: ENTRY_KIND.BOAT } });
}

export async function getRegistrationAvailability() {
  const teamCount = await getTeamCount();
  const openByDate = isRegistrationOpen();
  const openByCapacity = teamCount < MAX_TEAMS;
  return {
    teamCount,
    maxTeams: MAX_TEAMS,
    openByDate,
    openByCapacity,
    isOpen: openByDate && openByCapacity,
    isLandOpen: openByDate,
  };
}

export function emptyToNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function anglerCreateRows(
  anglers: Array<{
    fullName: string;
    phone?: string;
    email?: string;
    isYouth?: boolean;
    shirtSize: string;
  }>,
  forceYouth = false,
) {
  return anglers.map((a, index) => ({
    fullName: a.fullName,
    phone: a.phone ?? null,
    email: a.email ?? null,
    isYouth: forceYouth || a.isYouth === true,
    shirtSize: a.shirtSize,
    sortOrder: index,
  }));
}

export function teamCreateData(input: RegistrationInput) {
  const guided = input.boatType === "GUIDED";

  return {
    teamName: input.teamName,
    entryKind: ENTRY_KIND.BOAT,
    boatType: input.boatType,
    captainName: emptyToNull(input.captainName),
    captainPhone: emptyToNull(input.captainPhone),
    captainEmail: emptyToNull(input.captainEmail),
    contactName: guided ? null : emptyToNull(input.contactName),
    contactPhone: guided ? null : emptyToNull(input.contactPhone),
    contactEmail: guided ? null : emptyToNull(input.contactEmail),
    registrantEmail: input.registrantEmail,
    notes: input.notes ?? null,
    licenseConfirmed: input.licenseConfirmed,
    paymentStatus: "UNPAID" as const,
    sidePots: input.sidePots,
    amountDueCents: amountDueCents(input.sidePots.length),
    amountPaidCents: 0,
    anglers: {
      create: anglerCreateRows(input.anglers),
    },
  };
}

export function youthLandCreateData(input: YouthLandRegistrationInput) {
  const sidePots = input.sidePots ?? [];
  const amountDueCentsValue = amountDueForEntry({
    entryKind: ENTRY_KIND.YOUTH_LAND,
    sidePotCount: sidePots.length,
  });
  return {
    teamName: input.teamName,
    entryKind: ENTRY_KIND.YOUTH_LAND,
    boatType: "NON_GUIDED" as const,
    captainName: null,
    captainPhone: null,
    captainEmail: null,
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    registrantEmail: input.registrantEmail,
    notes: input.notes ?? null,
    licenseConfirmed: input.licenseConfirmed,
    paymentStatus: derivePaymentStatus(0, amountDueCentsValue),
    sidePots,
    amountDueCents: amountDueCentsValue,
    amountPaidCents: 0,
    anglers: {
      create: anglerCreateRows(input.anglers, true),
    },
  };
}

export async function createTeamRegistration(
  input: RegistrationInput,
  actor?: { userId: string; email: string } | null,
) {
  const availability = await getRegistrationAvailability();
  const blocked = publicCreateBlockedReason(availability);
  if (blocked) {
    return { ok: false as const, error: blocked, status: 403 };
  }

  const actorEmail = actor?.email.trim().toLowerCase() ?? "";
  const claimForActor =
    Boolean(actor) &&
    actorEmail.length > 0 &&
    actorEmail === input.registrantEmail.trim().toLowerCase();

  const team = await prisma.team.create({
    data: {
      ...teamCreateData(input),
      ...(claimForActor && actor
        ? { claimedByUserId: actor.userId }
        : {}),
    },
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
  });

  if (claimForActor && actor) {
    await ensureTeamMember(actor.userId, team.id);
  }

  return { ok: true as const, team };
}

export async function createYouthLandRegistration(
  input: YouthLandRegistrationInput,
  actor?: { userId: string; email: string } | null,
) {
  const availability = await getRegistrationAvailability();
  if (!availability.isLandOpen) {
    return {
      ok: false as const,
      error: PUBLIC_REGISTRATION_DATE_CLOSED_ERROR,
      status: 403,
    };
  }

  const actorEmail = actor?.email.trim().toLowerCase() ?? "";
  const claimForActor =
    Boolean(actor) &&
    actorEmail.length > 0 &&
    actorEmail === input.registrantEmail.trim().toLowerCase();

  const team = await prisma.team.create({
    data: {
      ...youthLandCreateData(input),
      ...(claimForActor && actor
        ? { claimedByUserId: actor.userId }
        : {}),
    },
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
  });

  if (claimForActor && actor) {
    await ensureTeamMember(actor.userId, team.id);
  }

  return { ok: true as const, team };
}

export async function registrationMatchesUnlock(input: {
  teamId: string;
  email: string;
}): Promise<boolean> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: input.teamId },
      select: { registrantEmail: true },
    });
    if (!team) return false;
    return normalizeUnlockEmail(team.registrantEmail) === input.email;
  } catch (error) {
    console.error("[unlock] registration lookup failed", error);
    return false;
  }
}

export async function claimTeamIfRegistrant(opts: {
  teamId: string;
  userId: string;
  email: string;
}) {
  const team = await prisma.team.findUnique({ where: { id: opts.teamId } });
  if (!team) return;
  if (team.registrantEmail.trim().toLowerCase() !== opts.email) return;
  if (!team.claimedByUserId) {
    await prisma.team.update({
      where: { id: opts.teamId },
      data: { claimedByUserId: opts.userId },
    });
  } else if (team.claimedByUserId !== opts.userId) {
    return;
  }
  await ensureTeamMember(opts.userId, opts.teamId);
}
