import { prisma } from "./db";
import {
  MAX_TEAMS,
  amountDueCents,
  isRegistrationOpen,
} from "./config";
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
