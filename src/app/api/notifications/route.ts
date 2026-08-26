import { NextResponse } from "next/server";
import { authorName, authorTeamName } from "@/lib/authors";
import { prisma } from "@/lib/db";
import { catchAlertHeadline } from "@/lib/notify";

/** Recent catch alerts for the in-app notification bell. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since");
  const limitRaw = searchParams.get("limit");
  const limit = Math.min(
    Math.max(Number.parseInt(limitRaw ?? "25", 10) || 25, 1),
    50,
  );

  const since = sinceRaw ? new Date(sinceRaw) : null;
  if (since && Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: "Invalid since timestamp" }, { status: 400 });
  }

  const catches = await prisma.fishCatch.findMany({
    where: since ? { createdAt: { gt: since } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      breed: true,
      lengthInches: true,
      weightLbs: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          claimedTeam: { select: { teamName: true } },
        },
      },
      angler: {
        select: {
          fullName: true,
          team: { select: { teamName: true } },
        },
      },
    },
  });

  const notifications = catches.map((c) => {
    const name = authorName(c);
    const team = authorTeamName(c) || name;
    const payload = {
      catchId: c.id,
      breed: c.breed,
      lengthInches: c.lengthInches,
      weightLbs: c.weightLbs,
      anglerName: name,
      teamName: team,
    };
    return {
      id: c.id,
      type: "catch" as const,
      title: `${name} · ${c.breed}`,
      body: catchAlertHeadline(payload),
      href: `/catches#catch-${c.id}`,
      createdAt: c.createdAt.toISOString(),
      lengthInches: c.lengthInches,
      weightLbs: c.weightLbs,
      anglerName: name,
      teamName: team,
      breed: c.breed,
    };
  });

  return NextResponse.json({ notifications });
}
