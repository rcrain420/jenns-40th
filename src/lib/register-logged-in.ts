/**
 * /register is the create-a-team path until the signed-in user is actually
 * on a boat (membership or claimed team). An account alone is not
 * registration — Google/email sign-in with no team still gets the form.
 *
 * Leaf module so Node tests can import it without extension rewriting.
 */
export const REGISTER_ALREADY_IN = {
  title: "You're already registered",
  body: "You're already in the tournament. Nothing else is needed.",
  ctaHref: "/team",
  ctaLabel: "See your boat",
} as const;

export const REGISTER_WELCOME = {
  title: "Welcome — register your team",
  body:
    "You're signed in, but you're not on a boat yet. Register your team below — add anglers, invite teammates, and add a captain if you have one.",
} as const;

export function userHasRegisteredTeam(
  user: { teamName?: string | null } | null | undefined,
): boolean {
  return Boolean(user?.teamName);
}

export function registerPageView(hasTeam: boolean): "form" | "already-registered" {
  return hasTeam ? "already-registered" : "form";
}

export function registerApiAllowsCreate(hasTeam: boolean): boolean {
  return !hasTeam;
}

/** Keep no-team users off the already-registered dead end after sign-in. */
export function afterAuthPath(input: { next: string; hasTeam: boolean }): string {
  const next = input.next;
  if (next === "/register/success" || next === "/login") {
    return input.hasTeam ? "/team" : "/register";
  }
  return next;
}
