import type { Metadata } from "next";
import { GuideSearch } from "@/components/GuideSearch";
import { PageShell } from "@/components/PageShell";
import { EVENT } from "@/lib/config";

export const metadata: Metadata = {
  title: `Find a Rockport fishing guide · ${EVENT.shortName}`,
  description: `Search Rockport, TX fishing guides and charters for ${EVENT.name} on ${EVENT.dateLabel}.`,
};

export default function GuidesPage() {
  return (
    <PageShell
      title="Find a Rockport guide"
      description={
        <>
          Teams arrange their own boat or captain. Search local charters by
          style, species, or party size — then carry the captain into
          registration.
        </>
      }
      backHref="/register"
      backLabel="Already booked? Register your team →"
    >
      <GuideSearch />
    </PageShell>
  );
}
