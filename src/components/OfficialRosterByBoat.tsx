import type { ReactNode } from "react";
import { FEE_PER_ANGLER_CENTS } from "@/lib/config";
import { formatUsdWhole } from "@/lib/money";
import {
  alsoOnThisBoatLine,
  isOfficialRosterSeat,
  officialRosterAdultSeatCount,
  officialRosterAnglerLine,
  officialRosterPotAmountLabel,
  officialRosterPotSummary,
  type OfficialRosterBoat,
} from "@/lib/official-roster";

export function BoatRosterHeading({
  boatName,
  isOwn = false,
}: {
  boatName: string;
  isOwn?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 bg-wave px-3 py-2 text-paper">
      <h3 className="font-display text-[0.95rem] leading-tight tracking-[0.08em] md:text-lg">
        {boatName}
      </h3>
      {isOwn ? (
        <span className="font-label text-[0.7rem] tracking-[0.12em] text-paper/75">
          Your boat
        </span>
      ) : null}
    </header>
  );
}

export function BoatRosterFrame({
  boatName,
  isOwn = false,
  children,
}: {
  boatName: string;
  isOwn?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <BoatRosterHeading boatName={boatName} isOwn={isOwn} />
      <div className="border border-t-0 border-wave/15 bg-paper px-4 py-3">
        {children}
      </div>
    </div>
  );
}

function BoatRosterRows({ boat }: { boat: OfficialRosterBoat }) {
  const seats = boat.anglers.filter(isOfficialRosterSeat);
  const extras = boat.anglers.filter((row) => !isOfficialRosterSeat(row));
  const adultAnglerCount = officialRosterAdultSeatCount(boat.anglers);
  const potCents = adultAnglerCount * FEE_PER_ANGLER_CENTS;
  const extraLine = alsoOnThisBoatLine(
    extras.map((row) => officialRosterAnglerLine(row)),
  );

  if (boat.anglers.length === 0) {
    return (
      <p className="text-sm text-ink/60">No names on the roster yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {seats.length === 0 ? (
        <p className="text-sm text-ink/60">No angler seats on this boat yet.</p>
      ) : (
        <ul className="space-y-1.5 text-ink/80">
          {seats.map((row, index) => (
            <li
              key={`${boat.id}:seat:${index}:${row.name}`}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="min-w-0">{officialRosterAnglerLine(row)}</span>
              <span className="font-label shrink-0 text-[0.75rem] tracking-[0.08em] text-ink/55">
                {officialRosterPotAmountLabel(
                  row,
                  FEE_PER_ANGLER_CENTS,
                  formatUsdWhole,
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="font-label text-[0.7rem] tracking-[0.08em] text-ink/50">
        {officialRosterPotSummary({
          adultAnglerCount,
          potCents,
          format: formatUsdWhole,
        })}
      </p>
      {extraLine ? (
        <p className="text-sm text-ink/50">{extraLine}</p>
      ) : null}
    </div>
  );
}

export function OfficialRosterByBoat({
  boats,
  banner = "Official roster",
  showBanner = true,
  emptyListLabel = "No boats have registered yet.",
  footer,
}: {
  boats: OfficialRosterBoat[];
  banner?: string;
  showBanner?: boolean;
  emptyListLabel?: string;
  footer?: ReactNode;
}) {
  return (
    <section>
      {showBanner ? <span className="section-banner">{banner}</span> : null}
      <div className={showBanner ? "mt-4 space-y-5" : "space-y-5"}>
        {boats.length === 0 ? (
          <p className="text-ink/70">{emptyListLabel}</p>
        ) : (
          boats.map((boat) => (
            <BoatRosterFrame
              key={boat.id}
              boatName={boat.boatName}
              isOwn={boat.isOwn}
            >
              <BoatRosterRows boat={boat} />
            </BoatRosterFrame>
          ))
        )}
      </div>
      {footer}
    </section>
  );
}
