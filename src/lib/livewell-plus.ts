/**
 * Test mode for Aaron: the Livewell + acts as if the tournament is live
 * (opens the add-catch upload). After he approves, flip this to `false`
 * so pre-start taps show LIVEWELL_PLUS_LOCKED instead.
 */
export const FORCE_LIVEWELL_PLUS_ACTIVE_FOR_TEST = true;

/** Same instant as EVENT.countdownTargetIso (lines in / captain's day). */
export const LIVEWELL_START_AT = new Date("2026-10-09T12:00:00.000Z");

/** End of Saturday Oct 10, 2026 (America/Chicago). */
export const LIVEWELL_END_AT = new Date("2026-10-11T05:00:00.000Z");

export const LIVEWELL_PLUS_LOCKED = {
  title: "Catches go live with the tournament",
  body: "Adding a catch opens when lines are in. Until then you can browse the Livewell — posting waits for the start.",
} as const;

/** File input: no `capture` so mobile OS offers Camera or Photo Library. */
export const CATCH_PHOTO_INPUT = {
  accept: "image/*",
} as const;

export function isTournamentLiveWindow(now = new Date()): boolean {
  const t = now.getTime();
  return t >= LIVEWELL_START_AT.getTime() && t < LIVEWELL_END_AT.getTime();
}

export function livewellPlusIsActive(now = new Date()): boolean {
  return FORCE_LIVEWELL_PLUS_ACTIVE_FOR_TEST || isTournamentLiveWindow(now);
}

/** FAB is for people who can already post (signed in + verified). */
export function canShowLivewellPlus(input: {
  loggedIn: boolean;
  emailVerified: boolean;
}): boolean {
  return input.loggedIn && input.emailVerified;
}
