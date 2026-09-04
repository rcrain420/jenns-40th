import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { PageShell } from "@/components/PageShell";
import { RegisterForm } from "@/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth";
import { firstName } from "@/lib/safe-path";
import {
  REGISTER_ALREADY_IN,
  REGISTER_AUTH,
  REGISTER_WELCOME,
  registerAuthMode,
  registerContinuePath,
  registerPageView,
  userHasRegisteredTeam,
} from "@/lib/register-logged-in";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

type BoatType = "GUIDED" | "NON_GUIDED";

function parseBoatType(value: string | string[] | undefined): BoatType | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "GUIDED" || raw === "NON_GUIDED") return raw;
  return undefined;
}

function parseFlag(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
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
  const viewer = await getCurrentUser();
  const params = await searchParams;
  const initialBoatType = parseBoatType(params.boat);
  const initialCaptainName = parseCaptain(params.captain);
  const emphasizeYouth = parseFlag(params.youth);

  const hasTeam = userHasRegisteredTeam(viewer);
  const view = registerPageView({
    signedIn: Boolean(viewer),
    hasTeam,
  });

  if (view === "auth") {
    return (
      <PageShell
        narrow
        title={REGISTER_AUTH.title}
        description={REGISTER_AUTH.body}
      >
        <AuthForm
          mode={registerAuthMode()}
          next={registerContinuePath(params)}
        />
      </PageShell>
    );
  }

  if (view === "already-registered") {
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

  const welcomeName = firstName(viewer?.name ?? "");
  const availability = await getRegistrationAvailability();

  return (
    <PageShell
      narrow
      title={REGISTER_WELCOME.title}
      description={
        <>
          Hi {welcomeName} — {REGISTER_WELCOME.body}{" "}
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
        emphasizeYouth={emphasizeYouth}
      />
    </PageShell>
  );
}
