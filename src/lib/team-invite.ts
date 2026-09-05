import { MAX_ANGLERS } from "./config";
import { prisma } from "./db";
import { publicAbsoluteUrl } from "./safe-path";
import {
  generateInviteCode,
  inviteCodeExpiresAt,
  isInviteCodeFormat,
  teamInviteSharePath,
} from "./team-invite-code";
import { verifyTeamInviteToken } from "./team-invite-token";

export {
  TEAM_INVITE_PURPOSE,
  TEAM_INVITE_TTL_SECONDS,
  issueTeamInviteToken,
  teamInvitePath,
  verifyTeamInviteToken,
} from "./team-invite-token";
export {
  anglerInviteSharePath,
  teamInviteSharePath,
} from "./team-invite-code";

const CODE_ATTEMPTS = 8;

export async function ensureTeamInviteCode(teamId: string): Promise<{
  code: string;
  expiresAt: Date;
}> {
  const now = new Date();
  const existing = await prisma.teamInviteCode.findFirst({
    where: { teamId, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return { code: existing.code, expiresAt: existing.expiresAt };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode();
    try {
      const created = await prisma.teamInviteCode.create({
        data: {
          teamId,
          code,
          expiresAt: inviteCodeExpiresAt(now),
        },
      });
      return { code: created.code, expiresAt: created.expiresAt };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not create an invite code");
}

export async function resolveTeamInviteCode(
  code: string,
  now = new Date(),
): Promise<
  { ok: true; teamId: string } | { ok: false; reason: "invalid" | "expired" }
> {
  const trimmed = code.trim();
  if (!isInviteCodeFormat(trimmed)) {
    return { ok: false, reason: "invalid" };
  }
  const row = await prisma.teamInviteCode.findUnique({
    where: { code: trimmed },
    select: { teamId: true, expiresAt: true },
  });
  if (!row) return { ok: false, reason: "invalid" };
  if (row.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, teamId: row.teamId };
}

export async function resolveJoinInvite(input: {
  token?: string;
  code?: string;
  now?: Date;
}): Promise<
  { ok: true; teamId: string } | { ok: false; reason: "invalid" | "expired" }
> {
  const token = input.token?.trim() ?? "";
  if (token) return verifyTeamInviteToken(token, input.now);
  const code = input.code?.trim() ?? "";
  if (code) return resolveTeamInviteCode(code, input.now);
  return { ok: false, reason: "invalid" };
}

export async function teamInviteUrl(teamId: string): Promise<string> {
  const { code } = await ensureTeamInviteCode(teamId);
  return publicAbsoluteUrl(teamInviteSharePath(code));
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
