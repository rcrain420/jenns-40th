import { PageShell } from "@/components/PageShell";
import { JoinTeamPanel } from "@/components/JoinTeamPanel";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveJoinInvite } from "@/lib/team-invite";

export async function JoinInviteView({
  token = "",
  code = "",
  email = "",
  name = "",
}: {
  token?: string;
  code?: string;
  email?: string;
  name?: string;
}) {
  const verified = await resolveJoinInvite({ token, code });
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
      description={
        viewer
          ? "This puts your account on the boat. Joining does not make you the captain or add you to the paid roster — the person who registered can add a captain anytime and send invites."
          : "Create an account with Google, Facebook, or email to hop on this boat. You do not need a password first if you use Google or Facebook. Joining does not make you the captain or add you to the paid roster."
      }
    >
      <JoinTeamPanel
        token={token}
        code={code}
        teamName={team.teamName}
        signedIn={Boolean(viewer)}
        initialEmail={email}
        initialName={name}
      />
    </PageShell>
  );
}
