import Link from "next/link";

export type BragRow = {
  id: string;
  teamName: string;
  breed: string;
  lengthInches: number;
  weightLbs: number;
  note?: string | null;
};

function formatLength(inches: number) {
  const rounded = Math.round(inches * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function formatWeight(lbs: number) {
  const rounded = Math.round(lbs * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function BragBoard({ rows }: { rows: BragRow[] }) {
  return (
    <section className="bg-wave px-5 py-10 text-paper md:px-11 md:py-11">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-paper/35 pb-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <p className="font-script text-[1.6rem] leading-none text-coral md:text-[2.5rem]">
              The
            </p>
            <h2 className="font-display text-[2.5rem] leading-[0.95] tracking-[0.04em] md:text-[3.875rem]">
              Brag Board
            </h2>
          </div>
          <p className="max-w-lg text-[0.95rem] leading-relaxed text-paper/80 md:text-[1.05rem]">
            Upload pics of what you&apos;re catching during the tournament.
            Nothing here counts — the only numbers that matter come off the
            scale at 2:00 on Saturday.
          </p>
          <Link
            href="/catches"
            className="font-label shrink-0 text-[0.95rem] tracking-[0.14em] text-paper transition hover:text-coral md:pb-1"
          >
            Post a catch →
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="mt-8 font-label text-sm tracking-[0.14em] text-paper/70">
            Nobody&apos;s bragging yet — be the first.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {rows.map((row, index) => {
              const rank = String(index + 1).padStart(2, "0");
              const detail = `${formatLength(row.lengthInches)}" ${row.breed}${
                row.note ? ` · ${row.note}` : ""
              }`;
              return (
                <li
                  key={row.id}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-paper/20 py-4 last:border-b-0 md:grid-cols-[4.4rem_1fr_minmax(12rem,1.4fr)_9rem] md:gap-4 md:py-5"
                >
                  <span
                    className={`font-display text-[1.4rem] md:text-[1.875rem] ${
                      index === 0 ? "text-coral" : "text-paper/50"
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display truncate text-[1.2rem] tracking-[0.03em] md:text-[1.625rem]">
                      {row.teamName}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-paper/75 md:hidden">
                      {detail}
                    </p>
                  </div>
                  <p className="hidden text-[1rem] text-paper/75 md:block">
                    {detail}
                  </p>
                  <p className="font-display text-right text-[1.2rem] md:text-[1.5rem]">
                    {formatWeight(row.weightLbs)} lb
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 md:hidden">
          <Link
            href="/catches"
            className="font-label text-[0.95rem] tracking-[0.14em] text-paper"
          >
            Post a catch →
          </Link>
        </div>
      </div>
    </section>
  );
}
