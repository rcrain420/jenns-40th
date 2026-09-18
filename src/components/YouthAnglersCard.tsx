import Link from "next/link";
import { YOUTH_TOURNAMENT } from "@/lib/config";
import { youthAnglersRegisteredLabel } from "@/lib/youth";

export function YouthAnglersCard({ count }: { count: number }) {
  return (
    <div className="double-frame flex flex-col gap-4 bg-paper p-5 md:p-7">
      <h2 className="font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]">
        Youth anglers
      </h2>
      <p className="font-label text-[0.95rem] tracking-[0.12em] text-sun md:text-[1.25rem]">
        RowRide
      </p>
      <p className="font-display text-[2.5rem] leading-none tracking-[0.02em] text-sun md:text-[4rem]">
        {count}
      </p>
      <p className="font-label text-[0.875rem] tracking-[0.1em] text-wave/70 md:text-base">
        {youthAnglersRegisteredLabel(count)}
      </p>
      <p className="text-[0.95rem] text-wave/70 md:text-base">
        {YOUTH_TOURNAMENT.tagline} Host-funded — kids register individually,
        not as a youth team, and are not in the main tournament pot.{" "}
        <Link href="/kids" className="text-sun underline-offset-2 hover:underline">
          {YOUTH_TOURNAMENT.name} →
        </Link>
      </p>
    </div>
  );
}
