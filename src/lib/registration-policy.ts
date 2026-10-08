/** Public registration policy. Leaf-safe for Node tests. */

import { REGISTRATION_CLOSES_AT } from "./config.ts";

/** Display only — keep in sync with MAX_TEAMS in config. */
const SOFT_CAP_TEAMS = 25;

const CHICAGO = "America/Chicago";

/**
 * Last instant a public submission is still accepted. REGISTRATION_CLOSES_AT
 * is midnight at the start of the next calendar day, so this stays on the
 * final open calendar day in America/Chicago.
 */
const REGISTRATION_LAST_OPEN_AT = new Date(REGISTRATION_CLOSES_AT.getTime() - 1);

function chicagoLabel(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO,
    ...options,
  }).format(date);
}

/** "Thursday, October 8" — the calendar day registration stays open through. */
export const REGISTRATION_DEADLINE_WEEKDAY = chicagoLabel(
  REGISTRATION_LAST_OPEN_AT,
  { weekday: "long", month: "long", day: "numeric" },
);

/** "October 8" — short headings such as "Register by October 8". */
export const REGISTRATION_DEADLINE_MONTH_DAY = chicagoLabel(
  REGISTRATION_LAST_OPEN_AT,
  { month: "long", day: "numeric" },
);

/** "October 8, 2026" */
export const REGISTRATION_DEADLINE_LABEL = chicagoLabel(
  REGISTRATION_LAST_OPEN_AT,
  { month: "long", day: "numeric", year: "numeric" },
);

/** "Thursday, October 8, 2026" */
export const REGISTRATION_DEADLINE_FULL = chicagoLabel(
  REGISTRATION_LAST_OPEN_AT,
  { weekday: "long", month: "long", day: "numeric", year: "numeric" },
);

export const NO_WALKUP_POLICY =
  "There are no walk-ups at the marina or on tournament weekend.";

export const PUBLIC_REGISTRATION_OPEN_NOTE = `Registration closes at midnight ${REGISTRATION_DEADLINE_WEEKDAY} (Central time).`;

export const PUBLIC_REGISTRATION_ENDED_PHRASE = `Public registration ended ${REGISTRATION_DEADLINE_WEEKDAY}`;

export const PUBLIC_REGISTRATION_DATE_CLOSED_ERROR = `Registration closed on ${REGISTRATION_DEADLINE_WEEKDAY}.`;

export const PUBLIC_REGISTRATION_FULL_ERROR = "Registration is full.";

export const REGISTRATION_CLOSED_TITLE = "Registration closed";

export const REGISTRATION_CLOSED_SHORT = "Registration closed";

export const ADMIN_EXCEPTION_NOTE =
  `This is the exception path. Public registration ends at midnight ${REGISTRATION_DEADLINE_FULL} (Central time), and there are no walk-ups. Admins may still add a team after that cutoff, or after the 25-boat soft cap, when organizers approve an exception.`;

export type PublicRegistrationGates = {
  openByDate: boolean;
  openByCapacity: boolean;
};

export function isPublicRegistrationOpen(gates: PublicRegistrationGates): boolean {
  return gates.openByDate && gates.openByCapacity;
}

/** Public /api/register and createTeamRegistration use this. Admin create must not. */
export function publicCreateBlockedReason(
  gates: PublicRegistrationGates,
): string | null {
  if (isPublicRegistrationOpen(gates)) return null;
  return !gates.openByDate
    ? PUBLIC_REGISTRATION_DATE_CLOSED_ERROR
    : PUBLIC_REGISTRATION_FULL_ERROR;
}

export function publicRegistrationClosedCopy(gates: PublicRegistrationGates): {
  title: string;
  body: string;
} {
  if (isPublicRegistrationOpen(gates)) {
    return {
      title: REGISTRATION_CLOSED_TITLE,
      body: `${PUBLIC_REGISTRATION_ENDED_PHRASE}. ${NO_WALKUP_POLICY}`,
    };
  }
  if (!gates.openByDate && !gates.openByCapacity) {
    return {
      title: REGISTRATION_CLOSED_TITLE,
      body: `${PUBLIC_REGISTRATION_ENDED_PHRASE}, and the field is full. ${NO_WALKUP_POLICY}`,
    };
  }
  if (!gates.openByDate) {
    return {
      title: REGISTRATION_CLOSED_TITLE,
      body: `${PUBLIC_REGISTRATION_ENDED_PHRASE}. ${NO_WALKUP_POLICY}`,
    };
  }
  return {
    title: REGISTRATION_CLOSED_TITLE,
    body: `The tournament is at capacity (${SOFT_CAP_TEAMS} boats). ${NO_WALKUP_POLICY}`,
  };
}

export function publicRegistrationDeadlineNote(isOpen: boolean): string {
  return isOpen
    ? `${PUBLIC_REGISTRATION_OPEN_NOTE} ${NO_WALKUP_POLICY}`
    : `${PUBLIC_REGISTRATION_ENDED_PHRASE}. ${NO_WALKUP_POLICY}`;
}
