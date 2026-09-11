import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendCaptainJoinInvite } from "@/lib/captain-invite";
import { ENTRY_KIND, amountDueForEntry } from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  markTeamFullyPaid,
  teamWithPaymentsInclude,
} from "@/lib/payment-ledger";
import { derivePaymentStatus } from "@/lib/payments";
import { emptyToNull } from "@/lib/registration";
import {
  adminMarkFullyPaidSchema,
  adminTeamUpdateSchema,
} from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

function isPlainObject(body: unknown): body is Record<string, unknown> {
  return Boolean(body) && typeof body === "object" && !Array.isArray(body);
}

export async function GET(_request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: teamWithPaymentsInclude,
  });

  if (!team) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ team });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const markPaid =
    adminMarkFullyPaidSchema.safeParse(body).success ||
    (isPlainObject(body) &&
      Object.keys(body).length === 1 &&
      body.paymentStatus === "PAID");

  if (markPaid) {
    const team = await markTeamFullyPaid({
      teamId: id,
      createdByUserId: session.id,
    });
    if (!team) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ team });
  }

  if (
    isPlainObject(body) &&
    Object.keys(body).length === 1 &&
    "paymentStatus" in body
  ) {
    return NextResponse.json(
      {
        error:
          "Payment status is derived from the ledger. Record a payment or mark the remaining balance paid.",
      },
      { status: 400 },
    );
  }

  const parsed = adminTeamUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const guided = input.boatType === "GUIDED";
  const previous = await prisma.team.findUnique({
    where: { id },
    select: { captainEmail: true, amountPaidCents: true },
  });
  if (!previous) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextDueCents = amountDueForEntry({
    entryKind: input.entryKind,
    sidePotCount:
      input.entryKind === ENTRY_KIND.YOUTH_LAND ? 0 : input.sidePots.length,
  });

  const team = await prisma.$transaction(async (tx) => {
    await tx.angler.deleteMany({ where: { teamId: id } });
    return tx.team.update({
      where: { id },
      data: {
        teamName: input.teamName,
        entryKind: input.entryKind ?? ENTRY_KIND.BOAT,
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
        paymentStatus: derivePaymentStatus(
          previous.amountPaidCents,
          nextDueCents,
        ),
        sidePots:
          input.entryKind === ENTRY_KIND.YOUTH_LAND ? [] : input.sidePots,
        amountDueCents: nextDueCents,
        anglers: {
          create: input.anglers.map((a, index) => ({
            fullName: a.fullName,
            phone: a.phone ?? null,
            email: a.email ?? null,
            isYouth: a.isYouth === true,
            shirtSize: a.shirtSize,
            sortOrder: index,
          })),
        },
      },
      include: teamWithPaymentsInclude,
    });
  });

  const prevEmail = previous.captainEmail?.trim().toLowerCase() ?? "";
  const nextEmail = team.captainEmail?.trim().toLowerCase() ?? "";
  if (nextEmail && nextEmail !== prevEmail) {
    try {
      await sendCaptainJoinInvite({
        teamId: team.id,
        teamName: team.teamName,
        captainName: team.captainName,
        captainEmail: team.captainEmail,
      });
    } catch (error) {
      console.error("[admin] captain invite failed", error);
    }
  }

  return NextResponse.json({ team });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
