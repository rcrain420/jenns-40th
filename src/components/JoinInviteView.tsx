import { PageShell } from "@/components/PageShell";
import { JoinTeamPanel } from "@/components/JoinTeamPanel";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BOAT_FULL_MESSAGE, canJoinBoat } from "@/lib/join-the-boat";
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
    select: {
      teamName: true,
      captainName: true,
      captainEmail: true,
      anglers: {
        select: { fullName: true, email: true, isYouth: true },
        orderBy: { sortOrder: "asc" },
      },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
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

  const alreadyOnThisBoat = viewer
    ? team.members.some((member) => member.user.id === viewer.id)
    : false;
  const roster = {
    anglers: team.anglers,
    members: team.members.map((member) => ({
      name: member.user.name,
      email: member.user.email,
    })),
    captain: {
      name: team.captainName,
      email: team.captainEmail,
    },
  };
  const joiningAsCaptain = Boolean(
    (email || viewer?.email) &&
      team.captainEmail &&
      (email || viewer?.email || "").trim().toLowerCase() ===
        team.captainEmail.trim().toLowerCase(),
  );
  // Signed-out visitors may still be a pending invitee; joinTeam decides
  // after they create an account. Only block a signed-in extra person here.
  if (
    viewer &&
    !alreadyOnThisBoat &&
    !canJoinBoat(roster, viewer.email)
  ) {
    return (
      <PageShell
        narrow
        title={`Join ${team.teamName}`}
        description={BOAT_FULL_MESSAGE}
      >
        <p className="text-ink/70">
          This boat already has four invited anglers. Ask the person who
          registered if a seat opens.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      narrow
      title={`Join ${team.teamName}`}
      description={
        joiningAsCaptain
          ? viewer
            ? "This puts your account on the boat as captain. You will see the same pages as the anglers. Captain login is not a $75 angler seat."
            : "Create an account with Google or email to hop on this boat as captain. You do not need a password first if you use Google. Captain login is not a $75 angler seat."
          : viewer
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
        joiningAsCaptain={joiningAsCaptain}
      />
    </PageShell>
  );
}
