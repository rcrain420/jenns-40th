import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { PageShell } from "@/components/PageShell";
import { YouthLandRegisterForm } from "@/components/YouthLandRegisterForm";
import { getCurrentUser } from "@/lib/auth";
import { YOUTH_TOURNAMENT } from "@/lib/config";
import { firstName } from "@/lib/safe-path";
import {
  REGISTER_ALREADY_IN,
  REGISTER_AUTH,
  registerAuthMode,
  registerContinuePath,
  registerPageView,
} from "@/lib/register-logged-in";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

export default async function YouthLandRegisterPage() {
  const viewer = await getCurrentUser();
  const view = registerPageView({
    signedIn: Boolean(viewer),
    hasTeam: false,
  });

  if (view === "auth") {
    return (
      <PageShell
        narrow
        title={`Enter ${YOUTH_TOURNAMENT.name}`}
        description={REGISTER_AUTH.body}
      >
        <AuthForm mode={registerAuthMode()} next={registerContinuePath({ land: "1" })} />
      </PageShell>
    );
  }

  if (view === "already-registered") {
    return (
      <PageShell
        narrow
        title={REGISTER_ALREADY_IN.title}
        description="You're already in. Manage a RowRide entry on My team. Kids enter RowRide on their own — they are not added to a boat roster. A parent who already registered a boat can still enter kids here. Kids may fish from land or by boat."
      >
        <p className="flex flex-wrap gap-4">
          <Link href="/kids" className="font-semibold text-sea hover:underline">
            Kids / RowRide
          </Link>
          <Link href="/team" className="font-semibold text-sea hover:underline">
            My team
          </Link>
        </p>
      </PageShell>
    );
  }

  const availability = await getRegistrationAvailability();
  const welcomeName = firstName(viewer?.name ?? "");

  return (
    <PageShell
      narrow
      title={`Enter ${YOUTH_TOURNAMENT.name}`}
      description={
        <>
          Hi {welcomeName} — kids enter RowRide on their own. No entry fee.
          Boat registration is a different product. Kids may fish from land
          or by boat. Official winner is the Weighmaster, not Livewell AI.
        </>
      }
    >
      <YouthLandRegisterForm
        registrationOpen={availability.isLandOpen}
        viewer={viewer}
      />
    </PageShell>
  );
}
