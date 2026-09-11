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
  userHasRegisteredTeam,
} from "@/lib/register-logged-in";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

export default async function YouthLandRegisterPage() {
  const viewer = await getCurrentUser();
  const hasTeam = userHasRegisteredTeam(viewer);
  const view = registerPageView({
    signedIn: Boolean(viewer),
    hasTeam,
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
        description="You're already in. Manage a land-only RowRide entry on My team. Kids are not added to a boat roster — another parent or guardian who is not already on a team can enter them for RowRide."
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
          Hi {welcomeName} — register kids from land with no boat and no entry
          fee. Official winner is the Weighmaster, not Livewell AI.
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
