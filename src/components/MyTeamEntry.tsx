import Link from "next/link";
import { InviteLinkCopy } from "@/components/InviteLinkCopy";
import {
  BoatRosterHeading,
  OfficialRosterByBoat,
} from "@/components/OfficialRosterByBoat";
import { TeamCaptainEditor } from "@/components/TeamCaptainEditor";
import { TeamRosterEditor } from "@/components/TeamRosterEditor";
import { boatContactNotAnglerNudge } from "@/lib/boat-contact-copy";
import { BOAT_ENTRY_CENTS, isRegistrationOpen, isYouthLandEntry } from "@/lib/config";
import {
  BOAT_FULL_NOTE,
  boatRosterStatusLabel,
  buildBoatRoster,
  isBoatContactNotAngler,
  isBoatInviteLocked,
} from "@/lib/join-the-boat";
import { formatUsd, formatUsdWhole } from "@/lib/money";
import { groupOfficialRosterByBoat } from "@/lib/official-roster";
import {
  INVITE_THE_BOAT_CAPTAIN_LINES,
  INVITE_THE_BOAT_MEMBER_LINES,
  INVITE_THE_BOAT_REGISTRANT_LINES,
} from "@/lib/team-invite-copy";
import { teamInviteUrl } from "@/lib/team-invite";
import type { UserTeam } from "@/lib/user-teams";

export function teamAnchorId(teamId: string): string {
  return `team-${teamId}`;
}

export function teamSwitchLabel(team: { teamName: string; entryKind: string }): string {
  return isYouthLandEntry(team.entryKind) ? "RowRide" : team.teamName;
}

export function teamEntryDescription(team: UserTeam): string {
  const rosterCount = team.anglers.length;
  if (isYouthLandEntry(team.entryKind)) {
    const paid =
      team.amountDueCents > 0
        ? ` · ${
            team.paymentStatus === "PAID"
              ? "Paid"
              : team.paymentStatus === "PARTIAL"
                ? `Partial · ${formatUsd(team.amountPaidCents)} paid`
                : "Unpaid"
          }`
        : "";
    return `RowRide · ${formatUsd(team.amountDueCents)}${paid} · ${rosterCount} youth ${
      rosterCount === 1 ? "angler" : "anglers"
    }`;
  }
  return `${formatUsd(team.amountDueCents)} due · ${
    team.paymentStatus === "PAID"
      ? "Paid"
      : team.paymentStatus === "PARTIAL"
        ? `Partial · ${formatUsd(team.amountPaidCents)} paid`
        : "Unpaid"
  } · ${rosterCount} ${rosterCount === 1 ? "angler" : "anglers"} on the official roster`;
}

export async function MyTeamEntry({
  team,
  user,
  isRegistrant,
  showJoined,
  showUnlocked,
}: {
  team: UserTeam;
  user: { id: string; email: string; name: string };
  isRegistrant: boolean;
  showJoined: boolean;
  showUnlocked: boolean;
}) {
  const landOnly = isYouthLandEntry(team.entryKind);
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
  const inviteUrl = inviteLocked || landOnly ? null : await teamInviteUrl(team.id);
  const registrantEmail =
    team.members.find((m) => m.user.id === team.claimedByUserId)?.user.email ??
    null;
  const viewerEmail = user.email.trim().toLowerCase();
  const isCaptain = team.captainEmail?.trim().toLowerCase() === viewerEmail;
  const captainRow = boatRoster.find(
    (row) =>
      row.status === "captain" ||
      row.status === "captain-joined" ||
      row.status === "captain-pending",
  );
  const showBoatContactNudge =
    isRegistrant &&
    !landOnly &&
    isBoatContactNotAngler(boatRosterInput.anglers, {
      email: user.email,
      name: user.name,
    });

  return (
    <article id={teamAnchorId(team.id)} className="scroll-mt-28 space-y-10">
      {showJoined ? (
        <p className="rounded-md bg-mist px-4 py-3 text-sm text-wave">
          {landOnly
            ? "You’re signed in for this RowRide entry. You can post on the Livewell from this account."
            : `You’re on ${team.teamName}. You can post on the Livewell from this account.`}
        </p>
      ) : null}
      {showUnlocked ? (
        <p className="rounded-md bg-mist px-4 py-3 text-sm text-wave">
          You’re signed in on this device.
          {landOnly
            ? " Manage youth anglers below."
            : inviteLocked
              ? ` ${BOAT_FULL_NOTE}`
              : " Invite teammates below."}
        </p>
      ) : null}
      {showBoatContactNudge ? (
        <p className="rounded-md border border-wave/15 bg-mist/60 px-4 py-3 text-sm text-wave">
          {boatContactNotAnglerNudge(formatUsdWhole(BOAT_ENTRY_CENTS))}
        </p>
      ) : null}

      {landOnly ? null : (
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
      )}

      {landOnly ? null : (
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
      )}

      {isRegistrant && !landOnly ? (
        <section>
          <span className="section-banner">Captain</span>
          <p className="mt-3 text-sm text-ink/65">
            Not required. Add or edit anytime — even after registration
            closes.
          </p>
          <div className="mt-4">
            <TeamCaptainEditor
              teamId={team.id}
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
            {landOnly
              ? "Youth anglers on this RowRide entry. Kids are individuals — they do not need a team or boat name. "
              : `Paid names on ${team.teamName}. `}
            <Link href="/teams" className="font-semibold text-sea hover:underline">
              {landOnly
                ? "See every boat and RowRide entry on Teams"
                : "See every boat on Teams"}
            </Link>
            .
          </p>
          <div className="mt-4 space-y-4">
            <BoatRosterHeading
              boatName={team.teamName}
              isOwn
              ownLabel={landOnly ? "Your RowRide entry" : "Your boat"}
            />
            <TeamRosterEditor
              teamId={team.id}
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
              canInvite={!landOnly}
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
              {landOnly
                ? "Only the parent who registered can change youth names. This list is this RowRide entry only. "
                : `Only the person who registered can change paid names or send invites. This list is ${team.teamName} only. `}
              <Link href="/teams" className="font-semibold text-sea hover:underline">
                {landOnly
                  ? "See every boat and RowRide entry on Teams"
                  : "See every boat on Teams"}
              </Link>
              .
            </p>
          }
        />
      )}
    </article>
  );
}
