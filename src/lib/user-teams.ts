import type { Prisma } from "@prisma/client";
import { isBoatEntry } from "./config";
import { prisma } from "./db";
import { uniqueTeamIds, userOwnsTeam } from "./team-membership";

export const teamRosterInclude = {
  anglers: { orderBy: { sortOrder: "asc" as const } },
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.TeamInclude;

export type UserTeam = Prisma.TeamGetPayload<{
  include: typeof teamRosterInclude;
}>;

/** Memberships plus claimed teams — covers ops moving a parent onto a boat. */
export async function findTeamsForUser(userId: string): Promise<UserTeam[]> {
  const [memberships, claimed] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId },
      include: { team: { include: teamRosterInclude } },
    }),
    prisma.team.findMany({
      where: { claimedByUserId: userId },
      include: teamRosterInclude,
    }),
  ]);

  const byId = new Map<string, UserTeam>();
  for (const team of claimed) byId.set(team.id, team);
  for (const row of memberships) byId.set(row.team.id, row.team);

  return [...byId.values()].sort((a, b) => {
    const aBoat = isBoatEntry(a.entryKind);
    const bBoat = isBoatEntry(b.entryKind);
    if (aBoat !== bBoat) return aBoat ? -1 : 1;
    return a.teamName.localeCompare(b.teamName);
  });
}

export async function findTeamIdsForUser(userId: string): Promise<string[]> {
  const [memberships, claimed] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    }),
    prisma.team.findMany({
      where: { claimedByUserId: userId },
      select: { id: true },
    }),
  ]);
  return uniqueTeamIds([
    ...memberships.map((row) => row.teamId),
    ...claimed.map((row) => row.id),
  ]);
}

export function userOwnsLoadedTeam(
  team: {
    claimedByUserId?: string | null;
    registrantEmail?: string | null;
  },
  user: { id: string; email?: string | null },
): boolean {
  return userOwnsTeam({
    userId: user.id,
    userEmail: user.email,
    claimedByUserId: team.claimedByUserId,
    registrantEmail: team.registrantEmail,
  });
}

export function pickTeamForEdit(
  teams: UserTeam[],
  user: { id: string; email?: string | null },
  teamId?: string | null,
): UserTeam | null {
  const owned = teams.filter((team) => userOwnsLoadedTeam(team, user));
  if (teamId) return owned.find((team) => team.id === teamId) ?? null;
  if (owned.length === 1) return owned[0] ?? null;
  return null;
}
