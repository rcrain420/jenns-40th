import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await getCurrentUser();
  if (user) {
    if (next.startsWith("/admin") && !user.isAdmin) {
      // stay on login — they are signed in but not admin
    } else {
      redirect(next === "/login" ? "/catches" : next);
    }
  }

  const mode = params.mode === "signup" ? "signup" : "signin";
  const adminHint = next.startsWith("/admin");

  return (
    <PageShell
      narrow
      title={mode === "signup" ? "Create your account" : "Welcome back"}
      description={
        adminHint
          ? "Organizer sign-in — use the admin email and your password."
          : "Same account for the Livewell, comments, and (if you’re an organizer) the admin console."
      }
    >
      {user && adminHint && !user.isAdmin ? (
        <p className="mb-6 rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">
          You’re signed in as {user.email}, but this account isn’t an admin.
        </p>
      ) : null}
      <AuthForm mode={mode} next={next} />
    </PageShell>
  );
}
