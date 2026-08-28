import type { Angler, Team } from "@prisma/client";

type TeamWithAnglers = Team & { anglers: Angler[] };

function csvEscape(value: string | number | boolean | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function teamsToCsv(teams: TeamWithAnglers[]): string {
  const headers = [
    "teamId",
    "teamName",
    "boatType",
    "captainName",
    "captainPhone",
    "contactName",
    "contactPhone",
    "contactEmail",
    "registrantEmail",
    "anglerCount",
    "anglers",
    "amountDueCents",
    "amountDue",
    "paymentStatus",
    "licenseConfirmed",
    "notes",
    "createdAt",
  ];

  const rows = teams.map((t) =>
    [
      t.id,
      t.teamName,
      t.boatType,
      t.captainName,
      t.captainPhone,
      t.contactName,
      t.contactPhone,
      t.contactEmail,
      t.registrantEmail,
      t.anglers.length,
      t.anglers
        .map((a) => (a.email ? `${a.fullName} <${a.email}>` : a.fullName))
        .join("; "),
      t.amountDueCents,
      (t.amountDueCents / 100).toFixed(2),
      t.paymentStatus,
      t.licenseConfirmed,
      t.notes,
      t.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
