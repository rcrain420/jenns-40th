/** Public registration policy. Leaf-safe for Node tests. */

import { MAX_TEAMS } from "./config";

/** End of day October 1, 2026 (America/Chicago) — matches REGISTRATION_CLOSES_AT. */
export const REGISTRATION_DEADLINE_LABEL = "October 1, 2026";

export const NO_WALKUP_POLICY =
  "There are no walk-ups at the marina or on tournament weekend.";

export const PUBLIC_REGISTRATION_DATE_CLOSED_ERROR = `Registration closed on ${REGISTRATION_DEADLINE_LABEL}.`;

export const PUBLIC_REGISTRATION_FULL_ERROR = "Registration is full.";

export const REGISTRATION_CLOSED_TITLE = "Registration closed";

export const REGISTRATION_CLOSED_SHORT = "Registration closed";

export const ADMIN_EXCEPTION_NOTE =
  "This is the exception path. Public registration ends October 1, 2026, and there are no walk-ups. Admins may still add a team after that cutoff, or after the 25-boat soft cap, when organizers approve an exception.";

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
      body: `Public registration ended ${REGISTRATION_DEADLINE_LABEL}. ${NO_WALKUP_POLICY}`,
    };
  }
  if (!gates.openByDate && !gates.openByCapacity) {
    return {
      title: REGISTRATION_CLOSED_TITLE,
      body: `Public registration ended ${REGISTRATION_DEADLINE_LABEL}, and the field is full. ${NO_WALKUP_POLICY}`,
    };
  }
  if (!gates.openByDate) {
    return {
      title: REGISTRATION_CLOSED_TITLE,
      body: `Public registration ended ${REGISTRATION_DEADLINE_LABEL}. ${NO_WALKUP_POLICY}`,
    };
  }
  return {
    title: REGISTRATION_CLOSED_TITLE,
    body: `The tournament is at capacity (${MAX_TEAMS} boats). ${NO_WALKUP_POLICY}`,
  };
}

export function publicRegistrationDeadlineNote(isOpen: boolean): string {
  return isOpen
    ? `Boats must be registered by ${REGISTRATION_DEADLINE_LABEL}. ${NO_WALKUP_POLICY}`
    : `Public registration ended ${REGISTRATION_DEADLINE_LABEL}. ${NO_WALKUP_POLICY}`;
}
