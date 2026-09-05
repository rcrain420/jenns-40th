import { createHash, randomBytes } from "crypto";
import { sanitizeAvatarUrl } from "./avatar";
import { prisma } from "./db";
import { sendConfirmEmail, sendResetEmail } from "./email";
import { hasPasswordHash, SOCIAL_ONLY_LOGIN_ERROR } from "./oauth-errors";
import {
  OAUTH_MARKS_EMAIL_VERIFIED,
  planOAuthUserLink,
  type OAuthProvider,
} from "./oauth";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "./password";
import { claimTeamIfRegistrant } from "./registration";
import {
  registrantClaimMatches,
  type RegistrantClaim,
} from "./open-my-team-access";
import { normalizeEmail } from "./safe-path";
import { shouldSendSignupConfirmEmail } from "./signup-confirm";
import { ensureTeamMember } from "./team-invite";

const CONFIRM_MS = 48 * 60 * 60 * 1000;
const RESET_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60_000;

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  teamName: string | null;
  isRegistrant: boolean;
};

export function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
  emailVerifiedAt: Date | null;
  role: string;
  claimedTeam?: { teamName: string } | null;
  membership?: { team?: { teamName: string } | null } | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    imageUrl: sanitizeAvatarUrl(user.imageUrl),
    emailVerified: Boolean(user.emailVerifiedAt),
    isAdmin: user.role === "ADMIN",
    teamName:
      user.membership?.team?.teamName ?? user.claimedTeam?.teamName ?? null,
    isRegistrant: Boolean(user.claimedTeam),
  };
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  imageUrl: true,
  emailVerifiedAt: true,
  role: true,
  claimedTeam: { select: { id: true, teamName: true } },
  membership: { select: { team: { select: { teamName: true } } } },
} as const;

function createTokenSecret(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function isAdminEmail(email: string): boolean {
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(expected && email === expected);
}

export async function promoteAdminIfNeeded(userId: string, email: string) {
  if (!isAdminEmail(email)) return;
  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });
}

/** Join and registrant unlock both drop the confirm-email post gate. */
export async function markEmailVerified(userId: string) {
  await prisma.user.updateMany({
    where: { id: userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });
}

export async function claimTeamForUser(userId: string, email: string) {
  const existing = await prisma.team.findFirst({
    where: { claimedByUserId: userId },
  });
  if (existing) {
    await ensureTeamMember(userId, existing.id);
    return existing;
  }

  const match = await prisma.team.findFirst({
    where: {
      claimedByUserId: null,
      registrantEmail: { equals: email, mode: "insensitive" },
    },
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!match) return null;

  const claimed = await prisma.team.update({
    where: { id: match.id },
    data: { claimedByUserId: userId },
  });
  await ensureTeamMember(userId, claimed.id);
  return claimed;
}

/** Invited captain email: attach the account to that boat on sign-in. */
export async function claimTeamIfCaptain(userId: string, email: string) {
  const existing = await prisma.teamMember.findUnique({ where: { userId } });
  if (existing) return existing;

  const team = await prisma.team.findFirst({
    where: { captainEmail: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!team) return null;

  const member = await ensureTeamMember(userId, team.id);
  await markEmailVerified(userId);
  return member;
}

export async function findTeamAnglersForUser(userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { userId },
    include: {
      team: { include: { anglers: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  const team =
    member?.team ??
    (await prisma.team.findUnique({
      where: { claimedByUserId: userId },
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    }));
  return team?.anglers ?? [];
}

export async function findAnglerForUser(userId: string, name: string) {
  const member = await prisma.teamMember.findUnique({
    where: { userId },
    include: { team: { include: { anglers: { orderBy: { sortOrder: "asc" } } } } },
  });
  const team =
    member?.team ??
    (await prisma.team.findUnique({
      where: { claimedByUserId: userId },
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    }));
  if (!team?.anglers.length) return null;
  const needle = name.trim().toLowerCase();
  return (
    team.anglers.find((a) => a.fullName.trim().toLowerCase() === needle) ??
    team.anglers[0] ??
    null
  );
}

async function issueEmailToken(
  userId: string,
  type: "CONFIRM_EMAIL" | "RESET_PASSWORD",
  ttlMs: number,
) {
  await prisma.emailToken.deleteMany({ where: { userId, type } });
  const secret = createTokenSecret();
  await prisma.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(secret),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return secret;
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

type AuthOk = {
  ok: true;
  user: PublicUser;
  devConfirmUrl?: string;
  confirmationEmailSent?: boolean;
};
type AuthFail = { ok: false; error: string; status: number; code?: string };

async function applyOpenMyTeamClaim(
  userId: string,
  email: string,
  claim?: RegistrantClaim | null,
) {
  if (!registrantClaimMatches(claim, email)) return false;
  await claimTeamIfRegistrant({
    teamId: claim.teamId,
    userId,
    email,
  });
  await markEmailVerified(userId);
  return true;
}

export async function signupUser(input: {
  name: string;
  email: string;
  password: string;
  next?: string;
  registrantClaim?: RegistrantClaim | null;
}): Promise<AuthOk | AuthFail> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!name) return { ok: false, error: "Tell us your name", status: 400 };
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Use a real email address", status: 400 };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password needs at least ${MIN_PASSWORD_LENGTH} characters`,
      status: 400,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "You already have an account — sign in.",
      status: 409,
      code: "exists",
    };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role: isAdminEmail(email) ? "ADMIN" : "GUEST",
    },
    select: userSelect,
  });

  await claimTeamForUser(user.id, email);
  await claimTeamIfCaptain(user.id, email);
  await applyOpenMyTeamClaim(user.id, email, input.registrantClaim);
  const refreshed = (await getUserById(user.id)) ?? user;
  const publicUser = toPublicUser(refreshed);

  if (
    !shouldSendSignupConfirmEmail({
      emailVerified: publicUser.emailVerified,
      next: input.next,
    })
  ) {
    return { ok: true, user: publicUser, confirmationEmailSent: false };
  }

  const secret = await issueEmailToken(user.id, "CONFIRM_EMAIL", CONFIRM_MS);
  let confirmationEmailSent = false;
  try {
    const delivery = await sendConfirmEmail({
      to: email,
      name,
      token: secret,
      next: input.next,
    });
    confirmationEmailSent = delivery.delivered;
    if (!delivery.delivered) {
      console.error("Confirmation email not delivered", delivery.error);
    }
  } catch (err) {
    console.error("Failed to send confirm email", err);
  }

  return {
    ok: true,
    user: publicUser,
    confirmationEmailSent,
    ...devConfirmPayload(secret, input.next),
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
  registrantClaim?: RegistrantClaim | null;
}): Promise<AuthOk | AuthFail> {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...userSelect, passwordHash: true },
  });
  if (!user) {
    return {
      ok: false,
      error: "No account for that email yet — create one.",
      status: 404,
      code: "missing",
    };
  }
  if (!hasPasswordHash(user.passwordHash)) {
    return {
      ok: false,
      error: SOCIAL_ONLY_LOGIN_ERROR,
      status: 401,
      code: "oauth_only",
    };
  }
  const matches = await verifyPassword(input.password, user.passwordHash);
  if (!matches) {
    return { ok: false, error: "That password doesn’t match.", status: 401 };
  }

  await promoteAdminIfNeeded(user.id, user.email);
  await claimTeamForUser(user.id, user.email);
  await claimTeamIfCaptain(user.id, user.email);
  await applyOpenMyTeamClaim(user.id, user.email, input.registrantClaim);
  const refreshed = (await getUserById(user.id)) ?? user;
  return { ok: true, user: toPublicUser(refreshed) };
}

export async function loginWithOAuth(input: {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  name: string;
  imageUrl?: string | null;
  registrantClaim?: RegistrantClaim | null;
}): Promise<AuthOk | AuthFail> {
  const email = normalizeEmail(input.email);
  const providerUserId = input.providerUserId.trim();
  const name = input.name.trim() || email.split("@")[0] || "Angler";
  const imageUrl = sanitizeAvatarUrl(input.imageUrl);

  if (!email || !email.includes("@")) {
    return {
      ok: false,
      error: "That account did not share an email. Use another account, or sign in with email.",
      status: 400,
      code: "missing_email",
    };
  }
  if (!providerUserId) {
    return { ok: false, error: "Could not finish sign-in.", status: 400 };
  }

  const existingLink = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId,
      },
    },
    select: { userId: true },
  });
  const existingEmail = existingLink
    ? null
    : await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

  const plan = planOAuthUserLink({
    existingOAuthUserId: existingLink?.userId ?? null,
    existingEmailUserId: existingEmail?.id ?? null,
  });

  let userId: string;
  if (plan === "login_linked" && existingLink) {
    userId = existingLink.userId;
  } else if (plan === "link_email" && existingEmail) {
    await prisma.oAuthAccount.create({
      data: {
        userId: existingEmail.id,
        provider: input.provider,
        providerUserId,
      },
    });
    userId = existingEmail.id;
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        imageUrl,
        passwordHash: null,
        emailVerifiedAt: OAUTH_MARKS_EMAIL_VERIFIED ? new Date() : null,
        role: isAdminEmail(email) ? "ADMIN" : "GUEST",
        oauthAccounts: {
          create: { provider: input.provider, providerUserId },
        },
      },
      select: { id: true },
    });
    userId = created.id;
  }

  if (imageUrl && plan !== "create") {
    await prisma.user.update({
      where: { id: userId },
      data: { imageUrl },
    });
  }

  if (OAUTH_MARKS_EMAIL_VERIFIED) {
    await markEmailVerified(userId);
  }
  await promoteAdminIfNeeded(userId, email);
  await claimTeamForUser(userId, email);
  await claimTeamIfCaptain(userId, email);
  await applyOpenMyTeamClaim(userId, email, input.registrantClaim);
  const refreshed = await getUserById(userId);
  if (!refreshed) {
    return { ok: false, error: "Account not found", status: 404 };
  }
  return { ok: true, user: toPublicUser(refreshed) };
}

export async function confirmEmailToken(
  token: string,
): Promise<AuthOk | AuthFail> {
  const row = await prisma.emailToken.findFirst({
    where: { tokenHash: hashToken(token), type: "CONFIRM_EMAIL" },
    include: { user: { select: userSelect } },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await prisma.emailToken.delete({ where: { id: row.id } });
    }
    return {
      ok: false,
      error: "This link expired. We can send a new one.",
      status: 400,
      code: "expired",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailToken.deleteMany({
      where: { userId: row.userId, type: "CONFIRM_EMAIL" },
    }),
  ]);
  await promoteAdminIfNeeded(row.userId, row.user.email);
  await claimTeamForUser(row.userId, row.user.email);
  await claimTeamIfCaptain(row.userId, row.user.email);
  const refreshed = await getUserById(row.userId);
  if (!refreshed) {
    return { ok: false, error: "Account not found", status: 404 };
  }
  return { ok: true, user: toPublicUser(refreshed) };
}

export async function resendConfirmation(opts: {
  userId: string;
  next?: string;
}): Promise<
  | { ok: true; cooldownMs?: number; devConfirmUrl?: string }
  | AuthFail
> {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: {
      ...userSelect,
      emailVerifiedAt: true,
      tokens: {
        where: { type: "CONFIRM_EMAIL" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!user) return { ok: false, error: "Sign in first", status: 401 };
  if (user.emailVerifiedAt) {
    return { ok: true };
  }
  const last = user.tokens[0];
  if (last) {
    const wait = RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime());
    if (wait > 0) {
      return { ok: true, cooldownMs: wait };
    }
  }
  const secret = await issueEmailToken(user.id, "CONFIRM_EMAIL", CONFIRM_MS);
  try {
    const delivery = await sendConfirmEmail({
      to: user.email,
      name: user.name,
      token: secret,
      next: opts.next,
    });
    if (!delivery.delivered) {
      console.error("Confirmation email not delivered", delivery.error);
      return {
        ok: false,
        error: "Could not send email — try again in a minute",
        status: 500,
      };
    }
  } catch (err) {
    console.error("Failed to resend confirm email", err);
    return { ok: false, error: "Could not send email — try again in a minute", status: 500 };
  }
  return { ok: true, ...devConfirmPayload(secret, opts.next) };
}

export async function requestPasswordReset(opts: {
  email: string;
  next?: string;
}): Promise<{ ok: true }> {
  const email = normalizeEmail(opts.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return { ok: true };
  const secret = await issueEmailToken(user.id, "RESET_PASSWORD", RESET_MS);
  try {
    await sendResetEmail({
      to: user.email,
      name: user.name,
      token: secret,
      next: opts.next,
    });
  } catch (err) {
    console.error("Failed to send reset email", err);
  }
  if (process.env.NODE_ENV !== "production") {
    console.info(`[auth] password reset URL for ${email}: ${secret}`);
  }
  return { ok: true };
}

export async function resetPasswordWithToken(opts: {
  token: string;
  password: string;
}): Promise<AuthOk | AuthFail> {
  if (opts.password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password needs at least ${MIN_PASSWORD_LENGTH} characters`,
      status: 400,
    };
  }
  const row = await prisma.emailToken.findFirst({
    where: { tokenHash: hashToken(opts.token), type: "RESET_PASSWORD" },
    include: { user: { select: userSelect } },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) await prisma.emailToken.delete({ where: { id: row.id } });
    return {
      ok: false,
      error: "This reset link expired. Request a new one.",
      status: 400,
      code: "expired",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(opts.password) },
    }),
    prisma.emailToken.deleteMany({ where: { userId: row.userId } }),
  ]);
  await promoteAdminIfNeeded(row.userId, row.user.email);
  await claimTeamForUser(row.userId, row.user.email);
  await claimTeamIfCaptain(row.userId, row.user.email);
  const refreshed = await getUserById(row.userId);
  if (!refreshed) {
    return { ok: false, error: "Account not found", status: 404 };
  }
  return { ok: true, user: toPublicUser(refreshed) };
}

function devConfirmPayload(secret: string, next?: string) {
  if (process.env.NODE_ENV === "production") return {};
  const url = new URL("/api/auth/confirm", "http://localhost:3000");
  url.searchParams.set("token", secret);
  if (next) url.searchParams.set("next", next);
  console.info(`[auth] confirm URL: ${url.pathname}${url.search}`);
  return { devConfirmUrl: `${url.pathname}${url.search}` };
}
