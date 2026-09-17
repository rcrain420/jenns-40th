import Link from "next/link";
import {
  MyTeamEntry,
  teamAnchorId,
  teamEntryDescription,
  teamSwitchLabel,
} from "@/components/MyTeamEntry";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { isYouthLandEntry } from "@/lib/config";
import { getRegistrationAvailability } from "@/lib/registration";
import { publicRegistrationClosedCopy } from "@/lib/registration-policy";
import { firstName } from "@/lib/safe-path";
import { findTeamsForUser, userOwnsLoadedTeam } from "@/lib/user-teams";

export const dynamic = "force-dynamic";

export default async function MyTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; unlocked?: string }>;
}) {
  const { joined, unlocked } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <PageShell
        narrow
        title="My team"
        description="Sign in to see your boat and invite link."
      >
        <p className="text-ink/70">
          <Link href="/login?next=/team" className="font-semibold text-sea hover:underline">
            Sign in
          </Link>{" "}
          first.
        </p>
      </PageShell>
    );
  }

  const teams = await findTeamsForUser(user.id);

  if (teams.length === 0) {
    const availability = await getRegistrationAvailability();
    if (!availability.openByDate) {
      const closed = publicRegistrationClosedCopy(availability);
      return (
        <PageShell
          narrow
          title="My team"
          description={`Hi ${firstName(user.name)} — you’re not on a boat yet.`}
        >
          <p className="text-ink/70">{closed.body}</p>
          <p className="mt-4 text-ink/70">
            If you&apos;re joining an existing boat, ask them for their invite
            link. Captains might never log in.
          </p>
          <p className="mt-4">
            <Link
              href="/rules#registration-deadline"
              className="font-semibold text-sea hover:underline"
            >
              Registration deadline in the rules →
            </Link>
          </p>
        </PageShell>
      );
    }

    if (!availability.isOpen) {
      const closed = publicRegistrationClosedCopy(availability);
      return (
        <PageShell
          narrow
          title="My team"
          description={`Hi ${firstName(user.name)} — you’re not on a boat yet.`}
        >
          <p className="text-ink/70">{closed.body}</p>
          <p className="mt-4 text-ink/70">
            RowRide signup is still open — it does not use a boat slot. Kids
            may fish from land or by boat.
          </p>
          <p className="mt-4 flex flex-wrap gap-4">
            <Link href="/register/youth" className="font-semibold text-sea hover:underline">
              Enter RowRide
            </Link>
          </p>
          <p className="mt-4 text-ink/70">
            If you&apos;re joining an existing boat, ask them for their invite
            link. Captains might never log in.
          </p>
        </PageShell>
      );
    }

    return (
      <PageShell
        narrow
        title="My team"
        description={`Hi ${firstName(user.name)} — you’re not on a boat yet.`}
      >
        <p className="text-ink/70">
          Register a boat — invite teammates, and add a captain anytime if you
          have one — or register kids separately for RowRide. Kids may fish
          from land or by boat.
        </p>
        <p className="mt-4 flex flex-wrap gap-4">
          <Link href="/register" className="font-semibold text-sea hover:underline">
            Register a boat
          </Link>
          <Link href="/register/youth" className="font-semibold text-sea hover:underline">
            Enter RowRide
          </Link>
        </p>
      </PageShell>
    );
  }

  const boat = teams.find((team) => !isYouthLandEntry(team.entryKind));
  const youthTeams = teams.filter((team) => isYouthLandEntry(team.entryKind));
  const showBoth = Boolean(boat && youthTeams.length > 0);
  const title = showBoth ? "My team" : teams[0].teamName;
  const description = showBoth
    ? `${boat?.teamName ?? "Your boat"} and your RowRide ${
        youthTeams.length === 1 ? "entry" : "entries"
      }.`
    : teamEntryDescription(teams[0]);

  return (
    <PageShell narrow title={title} description={description}>
      <div className="space-y-10">
        {showBoth ? (
          <nav className="flex flex-wrap gap-4 text-sm" aria-label="Your entries">
            {teams.map((team) => (
              <a
                key={team.id}
                href={`#${teamAnchorId(team.id)}`}
                className="font-semibold text-sea hover:underline"
              >
                {teamSwitchLabel(team)}
              </a>
            ))}
          </nav>
        ) : null}
        {teams.map((team, index) => (
          <MyTeamEntry
            key={team.id}
            team={team}
            user={user}
            isRegistrant={userOwnsLoadedTeam(team, user)}
            showJoined={joined === "1" && index === 0}
            showUnlocked={unlocked === "1" && index === 0}
          />
        ))}
      </div>
    </PageShell>
  );
}
