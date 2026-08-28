/**
 * Product contract 2026-08-28 (Aaron): a Livewell session means they
 * are already in the tournament. /register must not show the create-a-team
 * form — no second team, no Venmo pitch, no invite fields. One link to
 * their boat. Logged-out visitors still get the normal form.
 *
 * Leaf module so Node tests can import it without extension rewriting.
 */
export const REGISTER_ALREADY_IN = {
  title: "You're already registered",
  body: "You're already in the tournament. Nothing else is needed.",
  ctaHref: "/team",
  ctaLabel: "See your boat",
} as const;

export function registerPageView(
  loggedIn: boolean,
): "form" | "already-registered" {
  return loggedIn ? "already-registered" : "form";
}

export function registerApiAllowsCreate(loggedIn: boolean): boolean {
  return !loggedIn;
}
