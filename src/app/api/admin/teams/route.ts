import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendCaptainJoinInvite } from "@/lib/captain-invite";
import { ENTRY_KIND } from "@/lib/config";
import { prisma } from "@/lib/db";
import { teamCreateData, youthLandCreateData } from "@/lib/registration";
import {
  registrationSchema,
  youthLandRegistrationSchema,
} from "@/lib/validation";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const payment = searchParams.get("payment");
  const boatType = searchParams.get("boatType");

  const teams = await prisma.team.findMany({
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const filtered = teams.filter((t) => {
    if (payment && payment !== "ALL" && t.paymentStatus !== payment) {
      return false;
    }
    if (boatType && boatType !== "ALL" && t.boatType !== boatType) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      t.teamName,
      t.captainName,
      t.captainEmail,
      t.contactName,
      t.registrantEmail,
      ...t.anglers.map((a) => a.fullName),
      ...t.anglers.map((a) => a.email),
      ...t.anglers.map((a) => a.shirtSize),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return NextResponse.json({ teams: filtered });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload =
    typeof body === "object" && body !== null ? { ...body } : {};
  const wantsLand =
    "entryKind" in payload &&
    (payload as { entryKind?: string }).entryKind === ENTRY_KIND.YOUTH_LAND;

  // Exception path: do not call isRegistrationOpen or getRegistrationAvailability.
  // Admins may add a boat or land-only RowRide entry after the Oct 1 cutoff
  // and after the 25-boat soft cap.
  let team;
  if (wantsLand) {
    const parsed = youthLandRegistrationSchema.safeParse({
      ...payload,
      licenseConfirmed: true,
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
    team = await prisma.team.create({
      data: youthLandCreateData(parsed.data),
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    });
  } else {
    const parsed = registrationSchema.safeParse({
      ...payload,
      licenseConfirmed:
        (payload as { licenseConfirmed?: boolean }).licenseConfirmed ?? true,
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
    team = await prisma.team.create({
      data: teamCreateData(parsed.data),
      include: { anglers: { orderBy: { sortOrder: "asc" } } },
    });
  }

  if (team.captainEmail) {
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
