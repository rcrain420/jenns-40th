import { notFound } from "next/navigation";
import { InviteLinkCopy } from "@/components/InviteLinkCopy";
import { PageShell } from "@/components/PageShell";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { getCurrentUser } from "@/lib/auth";
import {
  EVENT,
  getVenmoPayUrl,
  PAID_SIDE_POTS,
  SIDE_POT_BUY_IN_CENTS,
  VENMO_HANDLE,
} from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  GUEST_REGISTRATION_EMAIL_FAILED,
  GUEST_REGISTRATION_EMAIL_SENT,
  GUEST_REGISTRATION_EMAIL_UNKNOWN,
} from "@/lib/guest-copy";
import { formatUsd } from "@/lib/money";
import { buildEventUnlockUrl } from "@/lib/registration-email";
import { issueEventUnlockToken } from "@/lib/event-unlock-token";
import { teamInviteUrl } from "@/lib/team-invite";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ team?: string; mail?: string }>;
};

export default async function RegisterSuccessPage({ searchParams }: Props) {
  const { team: teamId, mail } = await searchParams;
  if (!teamId) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { anglers: { orderBy: { sortOrder: "asc" } } },
  });

  if (!team) notFound();

  const viewer = await getCurrentUser();
  const accountName =
    team.anglers[0]?.fullName ||
    team.contactName ||
    team.captainName ||
    team.teamName;
  const showSetPassword =
    !viewer || viewer.email !== team.registrantEmail.trim().toLowerCase();

  const chosenPots = PAID_SIDE_POTS.filter((pot) =>
    team.sidePots.includes(pot.id),
  );
  const venmoNote = [
    `${team.teamName} — tournament`,
    ...chosenPots.map((pot) => pot.noteLabel),
  ].join(" + ");
  const venmoPayUrl = getVenmoPayUrl({
    amountCents: team.amountDueCents,
    note: venmoNote,
  });
  const inviteUrl = teamInviteUrl(team.id);
  const { token: unlockToken } = issueEventUnlockToken({
    teamId: team.id,
    email: team.registrantEmail,
  });
  const unlockUrl = buildEventUnlockUrl(unlockToken);
  const mailNote =
    mail === "sent"
      ? GUEST_REGISTRATION_EMAIL_SENT
      : mail === "failed"
        ? GUEST_REGISTRATION_EMAIL_FAILED
        : GUEST_REGISTRATION_EMAIL_UNKNOWN;

  return (
    <PageShell
      narrow
      eyebrow="You're registered"
      title={team.teamName}
      description={
        <>
          Amount due:{" "}
          <span className="font-semibold text-coral">
            {formatUsd(team.amountDueCents)}
          </span>{" "}
          ({team.anglers.length} anglers
          {team.sidePots.length > 0
            ? ` + ${team.sidePots.length} side pot${
                team.sidePots.length > 1 ? "s" : ""
              }`
            : ""}
          )
        </>
      }
    >
      <div className="space-y-8">
        <section className="border border-wave/15 bg-mist/60 px-5 py-5">
          <span className="section-banner">Links for this boat</span>
          <p
            className={`mt-3 text-sm ${
              mail === "failed" ? "text-alert" : "text-ink/75"
            }`}
            role={mail === "failed" ? "status" : undefined}
          >
            {mailNote}
          </p>
          <p className="mt-3 text-ink/75">
            You registered this team. That does not make you the captain — add
            the captain yourself if you have one, and invite teammates. Captains
            might never log in.
          </p>
          <p className="mt-3 text-ink/75">
            You will not show under team members until you create an account
            with the password form below. Teammates join as soon as they create
            an account — they do not need to confirm email first. Confirming
            email is only needed later to post catches.
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                Invite teammates
              </h3>
              <p className="mt-2 text-sm text-ink/65">
                Text this when you know who else is fishing. Joining does not
                add them to the paid roster — add official names from My team.
              </p>
              <div className="mt-3">
                <InviteLinkCopy url={inviteUrl} />
              </div>
            </div>
            <div>
              <h3 className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                Unlock catch logging
              </h3>
              <p className="mt-2 text-sm text-ink/65">
                Open this on the phone you&apos;ll use at the marina. It unlocks
                the Livewell on that device. You do not need the confirmation
                email.
              </p>
              <div className="mt-3">
                <InviteLinkCopy
                  url={unlockUrl}
                  buttonLabel="Copy unlock link"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <span className="section-banner">Next step: Venmo</span>
          <p className="mt-3 text-ink/75">
            Send payment to{" "}
            <a
              href={venmoPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sea hover:underline"
            >
              {VENMO_HANDLE}
            </a>
            . Use the note below so we can match your payment — it names your{" "}
            <strong>team</strong>
            {chosenPots.length > 0 ? (
              <>
                {" "}
                and the <strong>side pot(s)</strong> you entered
              </>
            ) : null}
            .
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 border border-wave/15 bg-mist/60 px-6 py-8 text-center">
            <p className="font-display text-2xl tracking-wide text-wave">
              {VENMO_HANDLE}
            </p>
            <div className="max-w-sm space-y-3 text-left text-sm text-ink/75">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                  Venmo note
                </p>
                <p className="mt-1.5 border border-wave/15 bg-paper px-3 py-2.5 font-mono text-ink">
                  {venmoNote}
                </p>
              </div>
              {chosenPots.length > 0 ? (
                <div>
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80">
                    Side pots included
                  </p>
                  <ul className="mt-1.5 space-y-1.5 font-mono text-ink">
                    {chosenPots.map((pot) => (
                      <li
                        key={pot.id}
                        className="border border-wave/15 bg-paper px-3 py-2"
                      >
                        {pot.name} — {formatUsd(SIDE_POT_BUY_IN_CENTS)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-ink/60">
                  No side pots selected — you can still join any of them via
                  Venmo at Friday&apos;s captain&apos;s meeting (
                  {formatUsd(SIDE_POT_BUY_IN_CENTS)} per team, per pot).
                </p>
              )}
            </div>
            <a
              href={venmoPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full max-w-xs items-center justify-center bg-wave px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-paper hover:bg-sea"
            >
              Open Venmo to pay
            </a>
            <p className="max-w-xs text-sm text-ink/60">
              On your phone, tap the button or QR to open Venmo with the amount
              and note filled in. Scanning works from another device.
            </p>
            <a
              href={venmoPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Venmo to pay"
              className="block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/venmo-qr.png"
                alt="Venmo QR code for @Officialish-Tournament"
                className="h-52 w-52 bg-paper object-contain"
              />
            </a>
          </div>
        </section>

        {showSetPassword ? (
          <section className="border-t border-dashed border-wave/25 pt-8">
            <h2 className="font-display text-2xl uppercase text-wave">
              Create your account
            </h2>
            <p className="mt-3 text-ink/75">
              Until you set a password, you are missing from the boat list. The
              captain does not need an account — you add them and send invites.
            </p>
            <div className="mt-4">
              <SetPasswordForm
                email={team.registrantEmail}
                name={accountName}
              />
            </div>
          </section>
        ) : null}

        <section className="border-t border-dashed border-wave/25 pt-8">
          <h2 className="font-display text-2xl uppercase text-wave">
            Team summary
          </h2>
          <dl className="mt-4 space-y-3 text-sm md:text-base">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Event</dt>
              <dd className="text-right">{EVENT.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Boat</dt>
              <dd>{team.boatType === "GUIDED" ? "Guided" : "Non-guided"}</dd>
            </div>
            {team.boatType === "GUIDED" ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Captain</dt>
                <dd className="text-right">
                  {team.captainName}
                  {team.captainPhone ? ` · ${team.captainPhone}` : ""}
                </dd>
              </div>
            ) : (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Primary contact</dt>
                <dd className="text-right">
                  {team.contactName}
                  {team.contactPhone ? ` · ${team.contactPhone}` : ""}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Anglers</dt>
              <dd className="text-right">
                {team.anglers.map((a) => a.fullName).join(", ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Payment</dt>
              <dd className="font-semibold text-alert">Unpaid</dd>
            </div>
          </dl>
        </section>

        <p className="font-script text-center text-3xl text-sun">
          See you in Rockport!
        </p>
      </div>
    </PageShell>
  );
}
