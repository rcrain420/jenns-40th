import { NextResponse } from "next/server";
import { authorName, authorTeamName, userTeamNameSelect } from "@/lib/authors";
import { prisma } from "@/lib/db";

/** Recent catches for live in-app alerts while Livewell is open. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : new Date(Date.now() - 60_000);

  if (Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: "Invalid since timestamp" }, { status: 400 });
  }

  const catches = await prisma.fishCatch.findMany({
    where: { createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: {
      id: true,
      breed: true,
      lengthInches: true,
      weightLbs: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          ...userTeamNameSelect,
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

  return NextResponse.json({
    catches: catches.map((c) => ({
      id: c.id,
      breed: c.breed,
      lengthInches: c.lengthInches,
      weightLbs: c.weightLbs,
      createdAt: c.createdAt.toISOString(),
      anglerName: authorName(c),
      teamName: authorTeamName(c) || authorName(c),
    })),
  });
}
