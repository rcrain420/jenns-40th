"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminConsoleStats,
  teamMatchesAdminEntryFilter,
} from "@/lib/admin-console";
import { isYouthLandEntry } from "@/lib/config";
import { formatUsd } from "@/lib/money";
import {
  paymentStatusLabel,
  remainingBalanceCents,
} from "@/lib/payments";

export type AdminTeamRow = {
  id: string;
  teamName: string;
  boatType: string;
  entryKind?: string;
  paymentStatus: string;
  amountDueCents: number;
  amountPaidCents: number;
  registrantEmail: string;
  captainName: string | null;
  contactName: string | null;
  anglers: {
    fullName: string;
    email?: string | null;
    isYouth?: boolean;
    shirtSize?: string | null;
  }[];
  createdAt: string;
};

function statusClass(status: string): string {
  if (status === "PAID") return "bg-foam/30 text-wave";
  if (status === "PARTIAL") return "bg-sun/15 text-sun";
  return "bg-alert/15 text-alert";
}

function youthOnBoatDetail(count: number): string | null {
  if (count <= 0) return null;
  const noun = count === 1 ? "youth angler" : "youth anglers";
  return `${count} ${noun} on a boat roster, outside this seat count`;
}

function StatCard({
  label,
  value,
  detail,
  title,
}: {
  label: string;
  value: string;
  detail?: string | null;
  title?: string | null;
}) {
  return (
    <div className="rounded-lg bg-mist px-4 py-5">
      <p className="text-sm text-ink/60" title={title ?? undefined}>
        {label}
      </p>
      <p className="mt-1 font-display text-3xl text-wave">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs leading-snug text-ink/50">{detail}</p>
      ) : null}
    </div>
  );
}

function TeamTable({
  teams,
  emptyLabel,
  headerClassName,
  markingId,
  onMarkPaid,
}: {
  teams: AdminTeamRow[];
  emptyLabel: string;
  headerClassName: string;
  markingId: string | null;
  onMarkPaid: (team: AdminTeamRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className={`${headerClassName} text-ink/70`}>
          <tr>
            <th className="px-4 py-3 font-medium">Team</th>
            <th className="px-4 py-3 font-medium">Boat</th>
            <th className="px-4 py-3 font-medium">Anglers</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">Paid</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const remaining = remainingBalanceCents(
              team.amountDueCents,
              team.amountPaidCents,
            );
            const rowRide = isYouthLandEntry(team.entryKind);
            return (
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
                  {rowRide
                    ? "RowRide"
                    : team.boatType === "GUIDED"
                      ? "Guided"
                      : "Non-guided"}
                </td>
                <td className="px-4 py-3">
                  {team.anglers.length}
                  {team.anglers.some((a) => a.isYouth) ? (
                    <span className="ml-2 inline-block rounded-full bg-sun/20 px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.08em] text-wave">
                      {team.anglers.filter((a) => a.isYouth).length} youth
                    </span>
                  ) : null}
                  {team.anglers.some((a) => a.shirtSize) ? (
                    <p className="mt-1 text-xs text-ink/50">
                      {team.anglers
                        .map((a) => a.shirtSize)
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{formatUsd(team.amountDueCents)}</td>
                <td className="px-4 py-3">{formatUsd(team.amountPaidCents)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(team.paymentStatus)}`}
                    >
                      {paymentStatusLabel(team.paymentStatus)}
                    </span>
                    {remaining > 0 ? (
                      <button
                        type="button"
                        disabled={markingId === team.id}
                        onClick={() => onMarkPaid(team)}
                        className="text-xs font-semibold text-sea hover:underline disabled:opacity-40"
                      >
                        {markingId === team.id
                          ? "Recording…"
                          : "Mark fully paid"}
                      </button>
                    ) : null}
                  </div>
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
            );
          })}
          {teams.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-ink/50">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard({ teams }: { teams: AdminTeamRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [payment, setPayment] = useState("ALL");
  const [boatType, setBoatType] = useState("ALL");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const stats = useMemo(() => adminConsoleStats(teams), [teams]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return teams.filter((t) => {
      if (payment !== "ALL" && t.paymentStatus !== payment) return false;
      if (!teamMatchesAdminEntryFilter(t, boatType)) return false;
      if (!query) return true;
      const hay = [
        t.teamName,
        t.captainName,
        t.contactName,
        t.registrantEmail,
        ...t.anglers.map((a) => a.fullName),
        ...t.anglers.map((a) => a.email),
        ...t.anglers.map((a) => a.shirtSize),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [teams, q, payment, boatType]);

  const adultTeams = filtered.filter((team) => !isYouthLandEntry(team.entryKind));
  const rowRideTeams = filtered.filter((team) =>
    isYouthLandEntry(team.entryKind),
  );
  const showAdult = boatType !== "YOUTH_LAND";
  const showRowRide = boatType === "ALL" || boatType === "YOUTH_LAND";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login?next=/admin");
    router.refresh();
  }

  async function markFullyPaid(team: AdminTeamRow) {
    const remaining = remainingBalanceCents(
      team.amountDueCents,
      team.amountPaidCents,
    );
    if (remaining <= 0) return;
    if (
      !confirm(
        `Record ${formatUsd(remaining)} as a manual payment for ${team.teamName}?`,
      )
    ) {
      return;
    }
    setMarkingId(team.id);
    try {
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markFullyPaid: true }),
      });
      if (res.ok) router.refresh();
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-wave md:text-4xl">
            Management console
          </h1>
          <p className="mt-1 text-ink/65">
            Adult boats, RowRide, and payments
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/weigh-in"
            className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:bg-mist"
          >
            Weigh-in
          </Link>
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

      <div className="space-y-6">
        <section className="space-y-3" aria-labelledby="adult-summary">
          <h2 id="adult-summary" className="font-label text-xs text-ink/55">
            Adult tournament
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Boats" value={String(stats.boatCount)} />
            <StatCard
              label="Anglers"
              value={String(stats.adultAnglerCount)}
              detail={youthOnBoatDetail(stats.youthOnBoats)}
              title="Adult seats on boat teams. Youth on a boat roster are not seats."
            />
            <StatCard
              label="Collected"
              value={formatUsd(stats.collectedCents)}
              detail="Adult boats only"
              title="Sum of recorded payments on adult boats, including overpayments"
            />
            <StatCard
              label="Outstanding"
              value={formatUsd(stats.outstandingCents)}
              detail="Adult boats only"
              title="Sum of remaining adult boat balances (due minus paid, not below zero)"
            />
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="rowride-summary">
          <div className="flex items-center gap-2">
            <h2 id="rowride-summary" className="font-label text-xs text-ink/55">
              RowRide
            </h2>
            <span className="rounded-full bg-sun/20 px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.08em] text-wave">
              Youth
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Entries" value={String(stats.rowRideCount)} />
            <StatCard label="Anglers" value={String(stats.rowRideAnglerCount)} />
            {stats.rowRideHasSidePotMoney ? (
              <>
                <StatCard
                  label="Side pots collected"
                  value={formatUsd(stats.rowRideCollectedCents)}
                  detail="RowRide side pots only"
                  title="Sum of recorded payments on RowRide entries"
                />
                <StatCard
                  label="Side pots outstanding"
                  value={formatUsd(stats.rowRideOutstandingCents)}
                  detail="RowRide side pots only"
                  title="Sum of remaining RowRide side-pot balances"
                />
              </>
            ) : null}
          </div>
          <p className="text-sm text-ink/55">
            {stats.rowRideHasSidePotMoney
              ? "Side-pot cards are RowRide buy-ins. They stay separate from the adult boat pot."
              : "Free entry. These rows stay off Collected and Outstanding unless a RowRide entry buys a side pot."}
          </p>
        </section>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search teams, anglers, email…"
          aria-label="Search teams, anglers, email"
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 outline-none ring-foam/40 focus:ring-2 md:max-w-sm"
        />
        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          aria-label="Payment status"
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2.5"
        >
          <option value="ALL">All payments</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
        <select
          value={boatType}
          onChange={(e) => setBoatType(e.target.value)}
          aria-label="Entry type"
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2.5"
        >
          <option value="ALL">All entries</option>
          <option value="GUIDED">Guided</option>
          <option value="NON_GUIDED">Non-guided</option>
          <option value="YOUTH_LAND">RowRide</option>
        </select>
      </div>

      <div className="space-y-8">
        {showAdult ? (
          <section className="space-y-3" data-section="adult-boats">
            <h2 className="font-display text-xl text-wave">Adult boats</h2>
            <TeamTable
              teams={adultTeams}
              emptyLabel="No adult boats match these filters."
              headerClassName="bg-mist/70"
              markingId={markingId}
              onMarkPaid={(team) => void markFullyPaid(team)}
            />
          </section>
        ) : null}
        {showRowRide ? (
          <section className="space-y-3" data-section="rowride">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-wave">RowRide</h2>
              <span className="rounded-full bg-sun/20 px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.08em] text-wave">
                Youth
              </span>
            </div>
            <TeamTable
              teams={rowRideTeams}
              emptyLabel="No RowRide entries match these filters."
              headerClassName="bg-sun/10"
              markingId={markingId}
              onMarkPaid={(team) => void markFullyPaid(team)}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
