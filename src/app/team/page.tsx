import Link from "next/link";
import { InviteLinkCopy } from "@/components/InviteLinkCopy";
import {
  BoatRosterHeading,
  OfficialRosterByBoat,
} from "@/components/OfficialRosterByBoat";
import { PageShell } from "@/components/PageShell";
import { TeamCaptainEditor } from "@/components/TeamCaptainEditor";
import { TeamRosterEditor } from "@/components/TeamRosterEditor";
import { getCurrentUser } from "@/lib/auth";
import { boatContactNotAnglerNudge } from "@/lib/boat-contact-copy";
import { BOAT_ENTRY_CENTS, isRegistrationOpen, isYouthLandEntry } from "@/lib/config";
import { getRegistrationAvailability } from "@/lib/registration";
import { publicRegistrationClosedCopy } from "@/lib/registration-policy";
import { firstName } from "@/lib/safe-path";
import { prisma } from "@/lib/db";
import {
  BOAT_FULL_NOTE,
  boatRosterStatusLabel,
  buildBoatRoster,
  isBoatContactNotAngler,
  isBoatInviteLocked,
} from "@/lib/join-the-boat";
import { formatUsd, formatUsdWhole } from "@/lib/money";
import {
  INVITE_THE_BOAT_CAPTAIN_LINES,
  INVITE_THE_BOAT_MEMBER_LINES,
  INVITE_THE_BOAT_REGISTRANT_LINES,
} from "@/lib/team-invite-copy";
import { groupOfficialRosterByBoat } from "@/lib/official-roster";
import { teamInviteUrl } from "@/lib/team-invite";

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

  const member = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          anglers: { orderBy: { sortOrder: "asc" } },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!member) {
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

  const team = member.team;
  const isRegistrant = team.claimedByUserId === user.id;
  const canEdit = isRegistrant && isRegistrationOpen();
  const boatRosterInput = {
    anglers: team.anglers.map((a) => ({
      fullName: a.fullName,
      email: a.email,
      isYouth: a.isYouth,
    })),
    members: team.members.map((m) => ({
      name: m.user.name,
      email: m.user.email,
    })),
    captain: {
      name: team.captainName,
      email: team.captainEmail,
    },
  };
  const boatRoster = buildBoatRoster(boatRosterInput);
  const inviteLocked = isBoatInviteLocked(boatRosterInput);
  const inviteUrl = inviteLocked ? null : await teamInviteUrl(team.id);
  const registrantEmail =
    team.members.find((m) => m.user.id === team.claimedByUserId)?.user.email ??
    null;
  const rosterCount = team.anglers.length;
  const viewerEmail = user.email.trim().toLowerCase();
  const isCaptain =
    team.captainEmail?.trim().toLowerCase() === viewerEmail;
  const captainRow = boatRoster.find((row) =>
    row.status === "captain" ||
    row.status === "captain-joined" ||
    row.status === "captain-pending",
  );
  const showBoatContactNudge =
    isRegistrant &&
    isBoatContactNotAngler(boatRosterInput.anglers, {
      email: user.email,
      name: user.name,
    });

  return (
    <PageShell
      narrow
      title={team.teamName}
      description={
        isYouthLandEntry(team.entryKind)
          ? `RowRide · $0 · ${rosterCount} youth ${rosterCount === 1 ? "angler" : "anglers"}`
          : `${formatUsd(team.amountDueCents)} due · ${
              team.paymentStatus === "PAID"
                ? "Paid"
                : team.paymentStatus === "PARTIAL"
                  ? `Partial · ${formatUsd(team.amountPaidCents)} paid`
                  : "Unpaid"
            } · ${rosterCount} ${rosterCount === 1 ? "angler" : "anglers"} on the official roster`
      }
    >
      <div className="space-y-10">
        {joined === "1" ? (
          <p className="rounded-md bg-mist px-4 py-3 text-sm text-wave">
            You’re on {team.teamName}. You can post on the Livewell from this
            account.
          </p>
        ) : null}
        {unlocked === "1" ? (
          <p className="rounded-md bg-mist px-4 py-3 text-sm text-wave">
            You’re signed in on this device.
            {inviteLocked
              ? ` ${BOAT_FULL_NOTE}`
              : " Invite teammates below."}
          </p>
        ) : null}
        {showBoatContactNudge ? (
          <p className="rounded-md border border-wave/15 bg-mist/60 px-4 py-3 text-sm text-wave">
            {boatContactNotAnglerNudge(formatUsdWhole(BOAT_ENTRY_CENTS))}
          </p>
        ) : null}

        <section>
          <span className="section-banner">Invite the boat</span>
          {inviteLocked || !inviteUrl ? (
            <p className="mt-3 text-ink/75">{BOAT_FULL_NOTE}</p>
          ) : (
            <>
              <div className="mt-3 space-y-2 text-ink/75">
                {(isRegistrant
                  ? INVITE_THE_BOAT_REGISTRANT_LINES
                  : isCaptain
                    ? INVITE_THE_BOAT_CAPTAIN_LINES
                    : INVITE_THE_BOAT_MEMBER_LINES
                ).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="mt-4">
                <InviteLinkCopy
                  url={inviteUrl}
                  shareTitle={`Join ${team.teamName}`}
                />
              </div>
            </>
          )}
        </section>

        <section>
          <span className="section-banner">On this boat</span>
          <ul className="mt-3 space-y-1 text-ink/80">
            {boatRoster.map((row, index) => (
              <li key={`${index}:${row.email ?? row.name}`}>
                {row.name}
                {row.email &&
                registrantEmail &&
                row.email === registrantEmail.trim().toLowerCase()
                  ? " · registered the team"
                  : ""}
                {" · "}
                {boatRosterStatusLabel(row.status)}
              </li>
            ))}
          </ul>
        </section>

        {isRegistrant ? (
          <section>
            <span className="section-banner">Captain</span>
            <p className="mt-3 text-sm text-ink/65">
              Not required. Add or edit anytime — even after registration
              closes.
            </p>
            <div className="mt-4">
              <TeamCaptainEditor
                boatType={team.boatType === "GUIDED" ? "GUIDED" : "NON_GUIDED"}
                captainName={team.captainName ?? ""}
                captainPhone={team.captainPhone ?? ""}
                captainEmail={team.captainEmail ?? ""}
                captainStatus={
                  captainRow?.status === "captain" ||
                  captainRow?.status === "captain-joined" ||
                  captainRow?.status === "captain-pending"
                    ? captainRow.status
                    : null
                }
                contactName={team.contactName ?? ""}
                contactPhone={team.contactPhone ?? ""}
                contactEmail={team.contactEmail ?? ""}
              />
            </div>
          </section>
        ) : null}

        {isRegistrant ? (
          <section>
            <span className="section-banner">Official roster</span>
            <p className="mt-3 text-sm text-ink/65">
              Paid names on {team.teamName}.{" "}
              <Link href="/teams" className="font-semibold text-sea hover:underline">
                See every boat on Teams
              </Link>
              .
            </p>
            <div className="mt-4 space-y-4">
              <BoatRosterHeading boatName={team.teamName} isOwn />
              <TeamRosterEditor
                initialAnglers={team.anglers.map((a) => ({
                  id: a.id,
                  fullName: a.fullName,
                  phone: a.phone ?? "",
                  email: a.email ?? "",
                  isYouth: a.isYouth,
                  shirtSize: a.shirtSize ?? "",
                }))}
                sidePotCount={team.sidePots.length}
                paymentStatus={
                  team.paymentStatus === "PAID"
                    ? "PAID"
                    : team.paymentStatus === "PARTIAL"
                      ? "PARTIAL"
                      : "UNPAID"
                }
                currentDueCents={team.amountDueCents}
                amountPaidCents={team.amountPaidCents}
                canEditRoster={canEdit}
                canInvite={!isYouthLandEntry(team.entryKind)}
                boatInviteLocked={inviteLocked}
                entryKind={team.entryKind}
              />
            </div>
          </section>
        ) : (
          <OfficialRosterByBoat
            boats={groupOfficialRosterByBoat([
              {
                id: team.id,
                teamName: team.teamName,
                isOwn: true,
                entryKind: team.entryKind,
                anglers: team.anglers.map((a) => ({
                  fullName: a.fullName,
                  isYouth: a.isYouth,
                })),
              },
            ])}
            footer={
              <p className="mt-3 text-sm text-ink/60">
                Only the person who registered can change paid names or send
                invites. This list is {team.teamName} only.{" "}
                <Link href="/teams" className="font-semibold text-sea hover:underline">
                  See every boat on Teams
                </Link>
                .
              </p>
            }
          />
        )}
      </div>
    </PageShell>
  );
}
