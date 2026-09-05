import { NextResponse } from "next/server";
import {
  authorName,
  authorTeamName,
  commentAuthorName,
  userTeamNameSelect,
} from "@/lib/authors";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isOwnCommentNotification,
  mergeBellNotifications,
  toCatchBellNotification,
  toCommentBellNotification,
} from "@/lib/notify";

/** Recent catch + comment alerts for the in-app notification bell. */
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

  const viewer = await getCurrentUser();
  const createdSince = since ? { createdAt: { gt: since } } : undefined;

  const [catches, comments] = await Promise.all([
    prisma.fishCatch.findMany({
      where: createdSince,
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
    }),
    prisma.catchComment.findMany({
      where: {
        ...createdSince,
        ...(viewer ? { NOT: { userId: viewer.id } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true } },
        angler: { select: { fullName: true } },
        catch: {
          select: {
            id: true,
            breed: true,
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
        },
      },
    }),
  ]);

  const catchAlerts = catches.map((c) => {
    const name = authorName(c);
    const team = authorTeamName(c) || name;
    return {
      ...toCatchBellNotification({
        catchId: c.id,
        breed: c.breed,
        lengthInches: c.lengthInches,
        weightLbs: c.weightLbs,
        anglerName: name,
        teamName: team,
        createdAt: c.createdAt.toISOString(),
      }),
      lengthInches: c.lengthInches,
      weightLbs: c.weightLbs,
      anglerName: name,
      teamName: team,
      breed: c.breed,
    };
  });

  const commentAlerts = comments
    .filter((row) => !isOwnCommentNotification(row.userId, viewer?.id))
    .map((row) => {
      const commenterName = commentAuthorName(row);
      const catchOwnerName = authorName(row.catch);
      return {
        ...toCommentBellNotification({
          commentId: row.id,
          catchId: row.catch.id,
          breed: row.catch.breed,
          commenterName,
          catchOwnerName,
          body: row.body,
          createdAt: row.createdAt.toISOString(),
        }),
        commenterName,
        catchOwnerName,
        breed: row.catch.breed,
      };
    });

  const notifications = mergeBellNotifications(
    [...catchAlerts, ...commentAlerts],
    limit,
  );

  return NextResponse.json({ notifications });
}
