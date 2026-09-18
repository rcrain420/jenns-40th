import Link from "next/link";
import {
  YOUTH_DIVISION_AWARDS,
  YOUTH_DIVISION_HEADING,
  youthDivisionAwardLine,
} from "@/lib/youth";

export function YouthDivisionAwards() {
  return (
    <div className="double-frame flex flex-col gap-4 bg-paper p-5 md:p-7">
      <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
        <span aria-hidden>🏆 </span>
        {YOUTH_DIVISION_HEADING}
      </h2>
      <ul className="flex flex-col gap-2.5 text-[1rem] md:text-[1.05rem]">
        {YOUTH_DIVISION_AWARDS.map((award) => (
          <li key={award.id} className="flex gap-2.5">
            <span className="text-sun" aria-hidden>
              ★
            </span>
            <span>{youthDivisionAwardLine(award)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[0.95rem] text-wave/70 md:text-base">
        Host-funded trophies for registered RowRide kids. One award per youth
        angler — so the fun spreads around.{" "}
        <Link
          href="/kids#rules"
          className="text-sun underline-offset-2 hover:underline"
        >
          {YOUTH_DIVISION_HEADING} rules →
        </Link>
      </p>
    </div>
  );
}
