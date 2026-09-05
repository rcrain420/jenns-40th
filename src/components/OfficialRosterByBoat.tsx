import type { ReactNode } from "react";
import {
  officialRosterAnglerLine,
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
              {boat.anglers.length === 0 ? (
                <p className="text-sm text-ink/60">
                  No names on the roster yet.
                </p>
              ) : (
                <ul className="space-y-1.5 text-ink/80">
                  {boat.anglers.map((row, index) => (
                    <li key={`${boat.id}:${index}:${row.name}`}>
                      {officialRosterAnglerLine(row)}
                    </li>
                  ))}
                </ul>
              )}
            </BoatRosterFrame>
          ))
        )}
      </div>
      {footer}
    </section>
  );
}
