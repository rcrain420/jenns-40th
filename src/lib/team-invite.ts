import { MAX_ANGLERS } from "./config";
import { prisma } from "./db";
import { getAppUrl } from "./safe-path";
import { issueTeamInviteToken, verifyTeamInviteToken } from "./team-invite-token";

export {
  TEAM_INVITE_PURPOSE,
  TEAM_INVITE_TTL_SECONDS,
  issueTeamInviteToken,
  verifyTeamInviteToken,
} from "./team-invite-token";

export function teamInviteUrl(teamId: string): string {
  const { token } = issueTeamInviteToken({ teamId });
  const url = new URL("/join", `${getAppUrl()}/`);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function ensureTeamMember(userId: string, teamId: string) {
  const existing = await prisma.teamMember.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.teamMember.create({ data: { userId, teamId } });
}

export async function joinTeam(userId: string, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, teamName: true },
  });
  if (!team) {
    return { ok: false as const, error: "That invite is not valid.", status: 404 };
  }

  const existing = await prisma.teamMember.findUnique({ where: { userId } });
  if (existing) {
    if (existing.teamId === teamId) {
      return { ok: true as const, already: true, teamName: team.teamName };
    }
    return {
      ok: false as const,
      error: "You’re already on another team.",
      status: 409,
    };
  }

  const count = await prisma.teamMember.count({ where: { teamId } });
  if (count >= MAX_ANGLERS) {
    return {
      ok: false as const,
      error: "This boat is full (4 accounts).",
      status: 409,
    };
  }

  await prisma.teamMember.create({ data: { userId, teamId } });
  return { ok: true as const, already: false, teamName: team.teamName };
}
