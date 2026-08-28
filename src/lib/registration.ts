import { prisma } from "./db";
import {
  MAX_TEAMS,
  amountDueCents,
  isRegistrationOpen,
} from "./config";
import { normalizeUnlockEmail } from "./event-unlock-token";
import { ensureTeamMember } from "./team-invite";
import type { RegistrationInput } from "./validation";

export async function getTeamCount(): Promise<number> {
  return prisma.team.count();
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
  };
}

export function teamCreateData(input: RegistrationInput) {
  const anglers = input.anglers.map((a, index) => ({
    fullName: a.fullName,
    phone: a.phone ?? null,
    email: a.email ?? null,
    sortOrder: index,
  }));

  const guided = input.boatType === "GUIDED";

  return {
    teamName: input.teamName,
    boatType: input.boatType,
    captainName: guided ? input.captainName!.trim() : null,
    captainPhone: guided ? input.captainPhone!.trim() : null,
    contactName: guided ? null : input.contactName!.trim(),
    contactPhone: guided ? null : input.contactPhone!.trim(),
    contactEmail: guided ? null : input.contactEmail!.trim(),
    registrantEmail: input.registrantEmail,
    notes: input.notes ?? null,
    licenseConfirmed: input.licenseConfirmed,
    paymentStatus: "UNPAID" as const,
    sidePots: input.sidePots,
    amountDueCents: amountDueCents(anglers.length, input.sidePots.length),
    anglers: {
      create: anglers,
    },
  };
}

export async function createTeamRegistration(input: RegistrationInput) {
  const availability = await getRegistrationAvailability();
  if (!availability.isOpen) {
    const reason = !availability.openByDate
      ? "Registration closed on October 1, 2026."
      : "Registration is full.";
    return { ok: false as const, error: reason, status: 403 };
  }

  const team = await prisma.team.create({
    data: teamCreateData(input),
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
  });

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

/** After a valid unlock token: log in the registrant if they have an account. */
export async function signInRegistrantFromUnlock(opts: {
  teamId: string;
  email: string;
}): Promise<{ userId: string | null; teamId: string }> {
  const email = normalizeUnlockEmail(opts.email);
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) return { userId: null, teamId: opts.teamId };

  if (!user.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }
  await claimTeamIfRegistrant({
    teamId: opts.teamId,
    userId: user.id,
    email: user.email,
  });
  return { userId: user.id, teamId: opts.teamId };
}
