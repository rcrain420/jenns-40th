"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/money";

export type AdminTeamRow = {
  id: string;
  teamName: string;
  boatType: string;
  paymentStatus: string;
  amountDueCents: number;
  registrantEmail: string;
  captainName: string | null;
  contactName: string | null;
  anglers: { fullName: string; email?: string | null }[];
  createdAt: string;
};

type Props = {
  teams: AdminTeamRow[];
  stats: {
    teamCount: number;
    anglerCount: number;
    collectedCents: number;
    outstandingCents: number;
  };
};

export function AdminDashboard({ teams, stats }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [payment, setPayment] = useState("ALL");
  const [boatType, setBoatType] = useState("ALL");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return teams.filter((t) => {
      if (payment !== "ALL" && t.paymentStatus !== payment) return false;
      if (boatType !== "ALL" && t.boatType !== boatType) return false;
      if (!query) return true;
      const hay = [
        t.teamName,
        t.captainName,
        t.contactName,
        t.registrantEmail,
        ...t.anglers.map((a) => a.fullName),
        ...t.anglers.map((a) => a.email),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [teams, q, payment, boatType]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login?next=/admin");
    router.refresh();
  }

  async function togglePaid(team: AdminTeamRow) {
    const next = team.paymentStatus === "PAID" ? "UNPAID" : "PAID";
    const res = await fetch(`/api/admin/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-wave md:text-4xl">
            Management console
          </h1>
          <p className="mt-1 text-ink/65">Teams, payments, and exports</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/export"
            className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:bg-mist"
          >
            Export CSV
          </a>
          <Link
            href="/admin/teams/new"
            className="rounded-md bg-wave px-4 py-2 text-sm font-semibold text-salt hover:bg-ink"
          >
            Add team
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-md px-4 py-2 text-sm text-ink/60 hover:text-ink"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Teams", String(stats.teamCount)],
          ["Anglers", String(stats.anglerCount)],
          ["Collected", formatUsd(stats.collectedCents)],
          ["Outstanding", formatUsd(stats.outstandingCents)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-mist px-4 py-5">
            <p className="text-sm text-ink/60">{label}</p>
            <p className="mt-1 font-display text-3xl text-wave">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search teams, anglers, email…"
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 outline-none ring-foam/40 focus:ring-2 md:max-w-sm"
        />
        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2.5"
        >
          <option value="ALL">All payments</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
        </select>
        <select
          value={boatType}
          onChange={(e) => setBoatType(e.target.value)}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2.5"
        >
          <option value="ALL">All boat types</option>
          <option value="GUIDED">Guided</option>
          <option value="NON_GUIDED">Non-guided</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-mist/70 text-ink/70">
            <tr>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Boat</th>
              <th className="px-4 py-3 font-medium">Anglers</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((team) => (
              <tr key={team.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/teams/${team.id}`}
                    className="font-semibold text-wave hover:underline"
                  >
                    {team.teamName}
                  </Link>
                  <p className="text-xs text-ink/50">{team.registrantEmail}</p>
                </td>
                <td className="px-4 py-3">
                  {team.boatType === "GUIDED" ? "Guided" : "Non-guided"}
                </td>
                <td className="px-4 py-3">{team.anglers.length}</td>
                <td className="px-4 py-3">
                  {formatUsd(team.amountDueCents)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => togglePaid(team)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      team.paymentStatus === "PAID"
                        ? "bg-foam/30 text-wave"
                        : "bg-alert/15 text-alert"
                    }`}
                  >
                    {team.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/teams/${team.id}`}
                    className="text-sea hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-ink/50"
                >
                  No teams match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
