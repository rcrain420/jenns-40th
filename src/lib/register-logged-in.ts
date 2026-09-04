/**
 * /register is the create-a-team path until the signed-in user is actually
 * on a boat (membership or claimed team). An account alone is not
 * registration — Google/email sign-in with no team still gets the form.
 *
 * Logged-out visitors never see that form first. They get the same
 * create-account / Google AuthForm used on Join the boat, then continue
 * here after sign-in.
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

export const REGISTER_AUTH = {
  title: "Create an account to register",
  body:
    "Log in, create an account, or continue with Google — then register your team. Same account for the Livewell and My team.",
} as const;

export type RegisterGateInput = {
  signedIn: boolean;
  hasTeam: boolean;
};

export type RegisterPageView = "auth" | "form" | "already-registered";

/** Join the boat opens Create account first; team register does the same. */
export function registerAuthMode(): "signup" {
  return "signup";
}

export function userHasRegisteredTeam(
  user: { teamName?: string | null } | null | undefined,
): boolean {
  return Boolean(user?.teamName);
}

export function registerPageView(input: RegisterGateInput): RegisterPageView {
  if (!input.signedIn) return "auth";
  return input.hasTeam ? "already-registered" : "form";
}

export function registerApiAllowsCreate(input: RegisterGateInput): boolean {
  return registerPageView(input) === "form";
}

const REGISTER_NEXT_KEYS = ["boat", "captain", "youth"] as const;

/** Keep youth / guide prefill on the OAuth and email `next` round-trip. */
export function registerContinuePath(
  params: { [key: string]: string | string[] | undefined } = {},
): string {
  const search = new URLSearchParams();
  for (const key of REGISTER_NEXT_KEYS) {
    const raw = params[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `/register?${qs}` : "/register";
}

/** Keep no-team users off the already-registered dead end after sign-in. */
export function afterAuthPath(input: { next: string; hasTeam: boolean }): string {
  const next = input.next;
  if (next === "/register/success" || next === "/login") {
    return input.hasTeam ? "/team" : "/register";
  }
  return next;
}
