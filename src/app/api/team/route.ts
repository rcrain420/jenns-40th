import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { amountDueCents, isRegistrationOpen } from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  BOAT_FULL_MESSAGE,
  isBoatInviteLocked,
  rosterWouldExceedInviteCapacity,
} from "@/lib/join-the-boat";
import { emptyToNull } from "@/lib/registration";
import { teamInviteUrl } from "@/lib/team-invite";
import { teamContactSchema, teamRosterSchema } from "@/lib/validation";

function boatRosterInput(team: {
  anglers: Array<{
    fullName: string;
    email: string | null;
    isYouth: boolean;
  }>;
  members: Array<{ user: { name: string; email: string } }>;
}) {
  return {
    anglers: team.anglers,
    members: team.members.map((member) => ({
      name: member.user.name,
      email: member.user.email,
    })),
  };
}

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
  const inviteLocked = isBoatInviteLocked(boatRosterInput(team));
  return NextResponse.json({
    team: {
      id: team.id,
      teamName: team.teamName,
      paymentStatus: team.paymentStatus,
      amountDueCents: team.amountDueCents,
      sidePots: team.sidePots,
      boatType: team.boatType,
      captainName: team.captainName ?? "",
      captainPhone: team.captainPhone ?? "",
      contactName: team.contactName ?? "",
      contactPhone: team.contactPhone ?? "",
      contactEmail: team.contactEmail ?? "",
      anglers: team.anglers.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone ?? "",
        email: a.email ?? "",
        isYouth: a.isYouth,
      })),
      members: team.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        isRegistrant: m.user.id === team.claimedByUserId,
      })),
    },
    inviteUrl: inviteLocked ? null : await teamInviteUrl(team.id),
    inviteLocked,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body && typeof body === "object" && !("anglers" in body)) {
    const contactParsed = teamContactSchema.safeParse(body);
    if (!contactParsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: contactParsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const input = contactParsed.data;
    const boatType = input.boatType ?? team.boatType;
    const guided = boatType === "GUIDED";
    const updatedContact = await prisma.team.update({
      where: { id: team.id },
      data: {
        boatType,
        captainName: guided ? emptyToNull(input.captainName) : null,
        captainPhone: guided ? emptyToNull(input.captainPhone) : null,
        contactName: guided ? null : emptyToNull(input.contactName),
        contactPhone: guided ? null : emptyToNull(input.contactPhone),
        contactEmail: guided ? null : emptyToNull(input.contactEmail),
      },
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({
      team: {
        id: updatedContact.id,
        teamName: updatedContact.teamName,
        boatType: updatedContact.boatType,
        captainName: updatedContact.captainName ?? "",
        captainPhone: updatedContact.captainPhone ?? "",
        contactName: updatedContact.contactName ?? "",
        contactPhone: updatedContact.contactPhone ?? "",
        contactEmail: updatedContact.contactEmail ?? "",
      },
    });
  }

  if (!isRegistrationOpen()) {
    return NextResponse.json(
      { error: "Registration is closed. Ask an organizer to change the roster." },
      { status: 403 },
    );
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
  if (
    rosterWouldExceedInviteCapacity({
      current: boatRosterInput(team),
      nextAnglers,
    })
  ) {
    return NextResponse.json(
      {
        error: `${BOAT_FULL_MESSAGE} Remove someone before adding another angler.`,
      },
      { status: 409 },
    );
  }
  const nextDue = amountDueCents(nextAnglers, team.sidePots.length);
  const addedPaidSeats = nextDue > team.amountDueCents;
  const paymentStatus =
    team.paymentStatus === "PAID" && addedPaidSeats ? "UNPAID" : team.paymentStatus;

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
            email: a.email ?? null,
            isYouth: a.isYouth === true,
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
        email: a.email ?? "",
        isYouth: a.isYouth,
      })),
    },
  });
}
