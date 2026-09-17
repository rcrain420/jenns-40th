import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { amountDueForEntry, isRegistrationOpen } from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  BOAT_FULL_MESSAGE,
  isBoatInviteLocked,
  rosterWouldExceedInviteCapacity,
} from "@/lib/join-the-boat";
import { derivePaymentStatus } from "@/lib/payments";
import { emptyToNull } from "@/lib/registration";
import { sendCaptainJoinInvite } from "@/lib/captain-invite";
import { teamInviteUrl } from "@/lib/team-invite";
import {
  findTeamsForUser,
  pickTeamForEdit,
  type UserTeam,
} from "@/lib/user-teams";
import { teamContactSchema, teamRosterSchema } from "@/lib/validation";

function boatRosterInput(team: {
  anglers: Array<{
    fullName: string;
    email: string | null;
    isYouth: boolean;
  }>;
  members: Array<{ user: { name: string; email: string } }>;
  captainName?: string | null;
  captainEmail?: string | null;
}) {
  return {
    anglers: team.anglers,
    members: team.members.map((member) => ({
      name: member.user.name,
      email: member.user.email,
    })),
    captain: {
      name: team.captainName,
      email: team.captainEmail,
    },
  };
}

function teamIdFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const teamId = (body as { teamId?: unknown }).teamId;
  return typeof teamId === "string" && teamId.trim() ? teamId.trim() : undefined;
}

function serializeTeam(team: UserTeam, userId: string) {
  return {
    id: team.id,
    teamName: team.teamName,
    paymentStatus: team.paymentStatus,
    amountDueCents: team.amountDueCents,
    amountPaidCents: team.amountPaidCents,
    sidePots: team.sidePots,
    entryKind: team.entryKind,
    boatType: team.boatType,
    captainName: team.captainName ?? "",
    captainPhone: team.captainPhone ?? "",
    captainEmail: team.captainEmail ?? "",
    contactName: team.contactName ?? "",
    contactPhone: team.contactPhone ?? "",
    contactEmail: team.contactEmail ?? "",
    anglers: team.anglers.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      phone: a.phone ?? "",
      email: a.email ?? "",
      isYouth: a.isYouth,
      shirtSize: a.shirtSize ?? "",
    })),
    members: team.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      isRegistrant: m.user.id === team.claimedByUserId,
    })),
    isRegistrant: team.claimedByUserId === userId,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const teams = await findTeamsForUser(user.id);
  const team = teams[0];
  if (!team) {
    return NextResponse.json({ error: "You’re not on a team yet." }, { status: 404 });
  }

  const isRegistrant = team.claimedByUserId === user.id;
  const inviteLocked = isBoatInviteLocked(boatRosterInput(team));
  return NextResponse.json({
    team: serializeTeam(team, user.id),
    teams: teams.map((row) => serializeTeam(row, user.id)),
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

  const teams = await findTeamsForUser(user.id);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const team = pickTeamForEdit(teams, user, teamIdFromBody(body));
  if (!team) {
    return NextResponse.json(
      { error: "Only the person who registered this team can edit the roster." },
      { status: 403 },
    );
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
    const nextCaptainEmail = emptyToNull(input.captainEmail);
    const updatedContact = await prisma.team.update({
      where: { id: team.id },
      data: {
        boatType,
        captainName: emptyToNull(input.captainName),
        captainPhone: emptyToNull(input.captainPhone),
        captainEmail: nextCaptainEmail,
        contactName: guided ? null : emptyToNull(input.contactName),
        contactPhone: guided ? null : emptyToNull(input.contactPhone),
        contactEmail: guided ? null : emptyToNull(input.contactEmail),
      },
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    });

    const invite = await sendCaptainJoinInvite({
      teamId: updatedContact.id,
      teamName: updatedContact.teamName,
      captainName: updatedContact.captainName,
      captainEmail: updatedContact.captainEmail,
    });

    return NextResponse.json({
      team: {
        id: updatedContact.id,
        teamName: updatedContact.teamName,
        boatType: updatedContact.boatType,
        captainName: updatedContact.captainName ?? "",
        captainPhone: updatedContact.captainPhone ?? "",
        captainEmail: updatedContact.captainEmail ?? "",
        contactName: updatedContact.contactName ?? "",
        contactPhone: updatedContact.contactPhone ?? "",
        contactEmail: updatedContact.contactEmail ?? "",
      },
      inviteSent: invite.ok && invite.sent,
      inviteError: invite.ok ? undefined : invite.error,
    });
  }

  if (!isRegistrationOpen()) {
    return NextResponse.json(
      { error: "Registration is closed. Ask an organizer to change the roster." },
      { status: 403 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teamRosterSchema.safeParse({
    ...body,
    entryKind: team.entryKind,
  });
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
    team.entryKind !== "YOUTH_LAND" &&
    rosterWouldExceedInviteCapacity({
      current: boatRosterInput(team),
      nextAnglers,
    })
  ) {
    return NextResponse.json(
      {
        error: `${BOAT_FULL_MESSAGE} Remove someone before adding another adult angler.`,
      },
      { status: 409 },
    );
  }
  const nextDue = amountDueForEntry({
    entryKind: team.entryKind,
    sidePotCount: team.sidePots.length,
  });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.angler.deleteMany({ where: { teamId: team.id } });
    return tx.team.update({
      where: { id: team.id },
      data: {
        amountDueCents: nextDue,
        paymentStatus: derivePaymentStatus(team.amountPaidCents, nextDue),
        anglers: {
          create: nextAnglers.map((a, index) => ({
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

  return NextResponse.json({
    team: {
      id: updated.id,
      teamName: updated.teamName,
      paymentStatus: updated.paymentStatus,
      amountDueCents: updated.amountDueCents,
      amountPaidCents: updated.amountPaidCents,
      sidePots: updated.sidePots,
      anglers: updated.anglers.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone ?? "",
        email: a.email ?? "",
        isYouth: a.isYouth,
        shirtSize: a.shirtSize ?? "",
      })),
    },
  });
}
