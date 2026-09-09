import type { Metadata } from "next";
import { GuideSearch } from "@/components/GuideSearch";
import { PageShell } from "@/components/PageShell";
import { EVENT } from "@/lib/config";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Find a Rockport fishing guide · ${EVENT.shortName}`,
  description: `Search Rockport, TX fishing guides and charters for ${EVENT.name} on ${EVENT.dateLabel}.`,
};

export default async function GuidesPage() {
  const availability = await getRegistrationAvailability();
  return (
    <PageShell
      title="Find a Rockport guide"
      description={
        <>
          Teams arrange their own boat or captain. Search local charters by
          style, species, or party size
          {availability.isOpen
            ? " — then carry the captain into registration."
            : ". Public registration is closed; there are no walk-ups."}
        </>
      }
      backHref={availability.isOpen ? "/register" : "/rules#registration-deadline"}
      backLabel={
        availability.isOpen
          ? "Already booked? Register your team →"
          : "Registration deadline in the rules →"
      }
    >
      <GuideSearch registrationOpen={availability.isOpen} />
    </PageShell>
  );
}
