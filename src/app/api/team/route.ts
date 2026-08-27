import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { amountDueCents, isRegistrationOpen } from "@/lib/config";
import { prisma } from "@/lib/db";
import { teamInviteUrl } from "@/lib/team-invite";
import { teamRosterSchema } from "@/lib/validation";

async function loadMemberTeam(userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { userId },
    include: {
      team: {
        include: {
          anglers: { orderBy: { sortOrder: "asc" } },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  return member?.team ?? null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const team = await loadMemberTeam(user.id);
  if (!team) {
    return NextResponse.json({ error: "You’re not on a team yet." }, { status: 404 });
  }

  const isRegistrant = team.claimedByUserId === user.id;
  return NextResponse.json({
    team: {
      id: team.id,
      teamName: team.teamName,
      paymentStatus: team.paymentStatus,
      amountDueCents: team.amountDueCents,
      sidePots: team.sidePots,
      anglers: team.anglers.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone ?? "",
      })),
      members: team.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        isRegistrant: m.user.id === team.claimedByUserId,
      })),
    },
    inviteUrl: teamInviteUrl(team.id),
    isRegistrant,
    canEditRoster: isRegistrant && isRegistrationOpen(),
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const team = await loadMemberTeam(user.id);
  if (!team || team.claimedByUserId !== user.id) {
    return NextResponse.json(
      { error: "Only the person who registered this team can edit the roster." },
      { status: 403 },
    );
  }

  if (!isRegistrationOpen()) {
    return NextResponse.json(
      { error: "Registration is closed. Ask an organizer to change the roster." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teamRosterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const nextAnglers = parsed.data.anglers;
  const nextDue = amountDueCents(nextAnglers.length, team.sidePots.length);
  const addedAnglers = nextAnglers.length > team.anglers.length;
  const paymentStatus =
    team.paymentStatus === "PAID" && addedAnglers ? "UNPAID" : team.paymentStatus;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.angler.deleteMany({ where: { teamId: team.id } });
    return tx.team.update({
      where: { id: team.id },
      data: {
        amountDueCents: nextDue,
        paymentStatus,
        anglers: {
          create: nextAnglers.map((a, index) => ({
            fullName: a.fullName,
            phone: a.phone ?? null,
            sortOrder: index,
          })),
        },
      },
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return NextResponse.json({
    team: {
      id: updated.id,
      teamName: updated.teamName,
      paymentStatus: updated.paymentStatus,
      amountDueCents: updated.amountDueCents,
      sidePots: updated.sidePots,
      anglers: updated.anglers.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone ?? "",
      })),
    },
  });
}
