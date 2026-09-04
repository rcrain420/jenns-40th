import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { oauthErrorMessage } from "@/lib/oauth-errors";
import { afterAuthPath, userHasRegisteredTeam } from "@/lib/register-logged-in";
import { safeNextPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    next?: string;
    email?: string;
    oauthError?: string;
  }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const initialEmail =
    typeof params.email === "string" ? params.email.trim() : "";
  const initialError = oauthErrorMessage(params.oauthError);
  const user = await getCurrentUser();
  if (user) {
    if (next.startsWith("/admin") && !user.isAdmin) {
      // stay on login — they are signed in but not admin
    } else if (
      !user.emailVerified &&
      !next.startsWith("/join") &&
      !next.startsWith("/team") &&
      !next.startsWith("/register")
    ) {
      redirect(`/confirm-email?next=${encodeURIComponent(next)}`);
    } else {
      redirect(
        afterAuthPath({
          next,
          hasTeam: userHasRegisteredTeam(user),
        }),
      );
    }
  }

  const mode = params.mode === "signup" ? "signup" : "signin";
  const adminHint = next.startsWith("/admin");
  const openMyTeam = mode === "signup" && next.startsWith("/team");
  const registerTeam = next.startsWith("/register");

  return (
    <PageShell
      narrow
      title={
        registerTeam && mode === "signup"
          ? "Create an account to register"
          : mode === "signup"
            ? "Create your account"
            : "Welcome back"
      }
      description={
        adminHint
          ? "Organizer sign-in — use the admin email and your password."
          : registerTeam
            ? "Log in, create an account, or continue with Google — then you’ll land back on team registration."
            : openMyTeam
              ? "Use this email — Google, Facebook, or a password — to get on the boat you registered. Roster and Livewell, no PIN."
              : "Same account for the Livewell, comments, and (if you’re an organizer) the admin console."
      }
    >
      {user && adminHint && !user.isAdmin ? (
        <p className="mb-6 rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">
          You’re signed in as {user.email}, but this account isn’t an admin.
        </p>
      ) : null}
      <AuthForm
        mode={mode}
        next={next}
        initialEmail={initialEmail}
        initialError={initialError}
      />
    </PageShell>
  );
}
