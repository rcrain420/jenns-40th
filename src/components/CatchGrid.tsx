import { CatchCard, type CatchCardFish } from "./CatchCard";
import type { CatchAnglerOption } from "./CatchLogger";

export type CatchGridAngler = {
  id: string;
  fullName: string;
  teamName: string;
  catches: CatchCardFish[];
};

export function CatchGrid({
  anglers,
  commentAnglers,
}: {
  anglers: CatchGridAngler[];
  commentAnglers: CatchAnglerOption[];
}) {
  if (anglers.length === 0) {
    return (
      <p className="mt-4 text-ink/60">
        No catches logged yet. Snap a photo above to start the board.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-12">
      {anglers.map((angler, index) => (
        <section
          key={angler.id}
          className={index === 0 ? "animate-rise" : "animate-rise-delay"}
        >
          <header className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--line)] pb-3">
            <div>
              <h3 className="font-display text-2xl text-wave">
                {angler.fullName}
              </h3>
              <p className="text-sm text-ink/55">{angler.teamName}</p>
            </div>
            <p className="text-sm font-medium text-sea">
              {angler.catches.length}{" "}
              {angler.catches.length === 1 ? "catch" : "catches"}
            </p>
          </header>

          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {angler.catches.map((fish) => (
              <CatchCard
                key={fish.id}
                fish={fish}
                anglerName={angler.fullName}
                anglers={commentAnglers}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
