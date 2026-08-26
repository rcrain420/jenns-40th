import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ResendConfirmButton } from "@/components/ResendConfirmButton";
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

  const expired = params.expired === "1";

  return (
    <PageShell
      narrow
      title={expired ? "This link expired" : "Confirm your email"}
      description={
        expired
          ? "We can send a new link if you’re signed in."
          : "This link is missing. We can send a new one if you’re signed in."
      }
    >
      <ResendConfirmButton next={next} />
      <p className="mt-6 text-sm text-ink/60">
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-sea hover:underline">
          Sign in
        </Link>{" "}
        first if you don’t see a resend button.
      </p>
    </PageShell>
  );
}
