import Link from "next/link";
import type { LineJarGuessView } from "@/lib/line-jar";

function paidClass(paid: boolean): string {
  if (paid) return "bg-foam/30 text-wave";
  return "bg-alert/15 text-alert";
}

export function LineJarAdmin({ rows }: { rows: LineJarGuessView[] }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-xs tracking-[0.14em] text-ink/50">
            Side contest
          </p>
          <h1 className="font-display text-3xl text-wave md:text-4xl">
            Line in the jar
          </h1>
          <p className="mt-1 max-w-xl text-ink/65">
            Donations and guesses for the fishing-line jar at the October 9–10
            Rockport tournament. Newest first. This list stays in the admin
            console.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md px-3 py-2 text-sm text-ink/60 hover:text-ink"
        >
          Teams
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-mist/70 text-ink/70">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Guessed length</th>
              <th className="px-4 py-3 font-medium">Donation amount</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-semibold text-ink">{row.name}</td>
                <td className="px-4 py-3 tabular-nums">{row.guessedLength}</td>
                <td className="px-4 py-3 tabular-nums">{row.donation}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paidClass(row.paid)}`}
                  >
                    {row.paidLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/70">{row.submitted}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/50">
                  No guesses yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
