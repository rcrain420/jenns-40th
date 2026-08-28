import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { RegisterForm } from "@/components/RegisterForm";
import { EVENT } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import {
  REGISTER_ALREADY_IN,
  registerPageView,
} from "@/lib/register-logged-in";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

type BoatType = "GUIDED" | "NON_GUIDED";

function parseBoatType(value: string | string[] | undefined): BoatType | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "GUIDED" || raw === "NON_GUIDED") return raw;
  return undefined;
}

function parseCaptain(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed.slice(0, 120) : undefined;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [availability, viewer] = await Promise.all([
    getRegistrationAvailability(),
    getCurrentUser(),
  ]);
  const params = await searchParams;
  const initialBoatType = parseBoatType(params.boat);
  const initialCaptainName = parseCaptain(params.captain);

  if (registerPageView(Boolean(viewer)) === "already-registered") {
    return (
      <PageShell
        narrow
        title={REGISTER_ALREADY_IN.title}
        description={REGISTER_ALREADY_IN.body}
      >
        <p>
          <Link
            href={REGISTER_ALREADY_IN.ctaHref}
            className="font-semibold text-sea hover:underline"
          >
            {REGISTER_ALREADY_IN.ctaLabel}
          </Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      narrow
      title="Register your team"
      description={
        <>
          {EVENT.dateLabel} · {EVENT.venue}, {EVENT.address}. You register the
          team — that does not make you the captain. Add the captain if you
          have one, then invite teammates. Captains might never log in.{" "}
          <Link
            href="/guides"
            className="text-coral underline-offset-4 hover:underline"
          >
            Need a Rockport captain?
          </Link>
        </>
      }
    >
      <RegisterForm
        registrationOpen={availability.isOpen}
        initialBoatType={initialBoatType}
        initialCaptainName={initialCaptainName}
        viewer={viewer}
      />
    </PageShell>
  );
}
