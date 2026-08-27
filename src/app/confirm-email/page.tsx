import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmEmailPanel } from "@/components/ConfirmEmailPanel";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string; expired?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const token = params.token?.trim() ?? "";

  if (token) {
    redirect(
      `/api/auth/confirm?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`,
    );
  }

  const user = await getCurrentUser();
  if (user?.emailVerified) {
    redirect(next);
  }

  const expired = params.expired === "1";

  return (
    <PageShell
      narrow
      title={expired ? "This link expired" : "Confirm your email"}
      description={
        user
          ? `If a confirmation email arrives at ${user.email}, tap it to finish posting. Joining a team does not wait on that.`
          : expired
            ? "Sign in and we can send a new link."
            : "Sign in and we can send a confirmation link."
      }
    >
      {user ? (
        <ConfirmEmailPanel email={user.email} next={next} />
      ) : (
        <p className="text-sm text-ink/70">
          <Link
            href={`/login?next=${encodeURIComponent(`/confirm-email?next=${next}`)}`}
            className="font-semibold text-sea hover:underline"
          >
            Sign in
          </Link>{" "}
          first, then we can send a new confirmation link.
        </p>
      )}
    </PageShell>
  );
}
