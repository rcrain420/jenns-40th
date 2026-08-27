import { PageShell } from "@/components/PageShell";
import { JoinTeamPanel } from "@/components/JoinTeamPanel";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyTeamInviteToken } from "@/lib/team-invite";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const verified = verifyTeamInviteToken(token);
  const viewer = await getCurrentUser();

  if (!verified.ok) {
    return (
      <PageShell
        narrow
        title="Invite not valid"
        description={
          verified.reason === "expired"
            ? "Ask your teammate to copy a fresh link from My team."
            : "This invite link is missing or broken."
        }
      >
        <p className="text-ink/70">
          Open the link they texted you, or ask them to send it again from My
          team.
        </p>
      </PageShell>
    );
  }

  const team = await prisma.team.findUnique({
    where: { id: verified.teamId },
    select: { teamName: true },
  });

  if (!team) {
    return (
      <PageShell
        narrow
        title="Invite not valid"
        description="That team is gone."
      >
        <p className="text-ink/70">Ask your teammate for a new link.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      narrow
      title={`Join ${team.teamName}`}
      description="This puts your account on the boat so Livewell posts show the team name. You can join before you confirm email."
    >
      <JoinTeamPanel
        token={token}
        teamName={team.teamName}
        signedIn={Boolean(viewer)}
      />
    </PageShell>
  );
}
