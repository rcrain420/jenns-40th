import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendCaptainJoinInvite } from "@/lib/captain-invite";
import { amountDueCents } from "@/lib/config";
import { prisma } from "@/lib/db";
import { emptyToNull } from "@/lib/registration";
import { adminTeamUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
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

  // Allow simple payment toggle
  if (
    body &&
    typeof body === "object" &&
    "paymentStatus" in body &&
    Object.keys(body as object).length === 1
  ) {
    const status = (body as { paymentStatus: string }).paymentStatus;
    if (status !== "PAID" && status !== "UNPAID") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const team = await prisma.team.update({
      where: { id },
      data: { paymentStatus: status },
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ team });
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
    select: { captainEmail: true },
  });

  const team = await prisma.$transaction(async (tx) => {
    await tx.angler.deleteMany({ where: { teamId: id } });
    return tx.team.update({
      where: { id },
      data: {
        teamName: input.teamName,
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
        paymentStatus: input.paymentStatus,
        sidePots: input.sidePots,
        amountDueCents: amountDueCents(input.anglers, input.sidePots.length),
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
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    });
  });

  const prevEmail = previous?.captainEmail?.trim().toLowerCase() ?? "";
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
