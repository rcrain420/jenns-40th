import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { teamsToCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teams = await prisma.team.findMany({
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const csv = teamsToCsv(teams);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jenns-40th-registrations.csv"`,
    },
  });
}
