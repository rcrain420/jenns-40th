import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  derivePaymentStatus,
  MARK_FULLY_PAID_NOTE,
  PAYMENT_SOURCE,
  remainingBalanceCents,
} from "./payments";

export const paymentWithAuthorInclude = {
  createdByUser: { select: { id: true, name: true } },
} as const;

export const teamWithPaymentsInclude = {
  anglers: { orderBy: { sortOrder: "asc" as const } },
  payments: {
    orderBy: { createdAt: "desc" as const },
    include: paymentWithAuthorInclude,
  },
} as const;

type Db = Prisma.TransactionClient;

export function toAdminPayment(payment: {
  id: string;
  amountCents: number;
  note: string | null;
  source: string;
  createdAt: Date;
  createdByUserId: string | null;
  createdByUser?: { id: string; name: string } | null;
}) {
  return {
    id: payment.id,
    amountCents: payment.amountCents,
    note: payment.note,
    source: payment.source,
    createdAt: payment.createdAt.toISOString(),
    createdByUserId: payment.createdByUserId,
    createdByName: payment.createdByUser?.name ?? null,
  };
}

export async function syncTeamPaymentTotals(tx: Db, teamId: string) {
  const [team, agg] = await Promise.all([
    tx.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { amountDueCents: true },
    }),
    tx.payment.aggregate({
      where: { teamId },
      _sum: { amountCents: true },
    }),
  ]);
  const amountPaidCents = agg._sum.amountCents ?? 0;
  return tx.team.update({
    where: { id: teamId },
    data: {
      amountPaidCents,
      paymentStatus: derivePaymentStatus(amountPaidCents, team.amountDueCents),
    },
    include: teamWithPaymentsInclude,
  });
}

export async function addManualPayment(input: {
  teamId: string;
  amountCents: number;
  note?: string | null;
  createdByUserId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: input.teamId },
      select: { id: true },
    });
    if (!team) return null;
    await tx.payment.create({
      data: {
        teamId: input.teamId,
        amountCents: input.amountCents,
        note: input.note ?? null,
        source: PAYMENT_SOURCE.MANUAL,
        createdByUserId: input.createdByUserId ?? null,
      },
    });
    return syncTeamPaymentTotals(tx, input.teamId);
  });
}

export async function updateManualPayment(input: {
  teamId: string;
  paymentId: string;
  amountCents?: number;
  note?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { id: input.paymentId, teamId: input.teamId },
    });
    if (!payment) return null;
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        ...(input.amountCents !== undefined
          ? { amountCents: input.amountCents }
          : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      },
    });
    return syncTeamPaymentTotals(tx, input.teamId);
  });
}

export async function deleteManualPayment(input: {
  teamId: string;
  paymentId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { id: input.paymentId, teamId: input.teamId },
    });
    if (!payment) return null;
    await tx.payment.delete({ where: { id: payment.id } });
    return syncTeamPaymentTotals(tx, input.teamId);
  });
}

export async function markTeamFullyPaid(input: {
  teamId: string;
  createdByUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: input.teamId },
      select: {
        id: true,
        amountDueCents: true,
        amountPaidCents: true,
      },
    });
    if (!team) return null;
    const remaining = remainingBalanceCents(
      team.amountDueCents,
      team.amountPaidCents,
    );
    if (remaining > 0) {
      await tx.payment.create({
        data: {
          teamId: team.id,
          amountCents: remaining,
          note: MARK_FULLY_PAID_NOTE,
          source: PAYMENT_SOURCE.MANUAL,
          createdByUserId: input.createdByUserId,
        },
      });
    }
    return syncTeamPaymentTotals(tx, team.id);
  });
}
