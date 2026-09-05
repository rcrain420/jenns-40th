import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export default async function UnlockFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const missing = reason === "missing";

  return (
    <PageShell
      narrow
      eyebrow="My team"
      title={missing ? "Link needed" : "That link didn't take"}
      description={
        missing
          ? "Use the Open my team link on your registration success page — it works even if the confirmation email never arrived."
          : "This link is expired or not valid anymore. Copy a fresh one from the registration success page, or sign in."
      }
      backHref="/login?next=/team"
      backLabel="← Sign in"
    >
      <div className="space-y-5 text-ink/80">
        <p>
          Team access and the Livewell need an account. Sign in or create one.
        </p>
        <p>
          <Link
            href="/login?next=/team"
            className="font-semibold text-sea hover:underline"
          >
            Sign in
          </Link>
          {" · "}
          <Link
            href="/login?mode=signup&next=/team"
            className="font-semibold text-sea hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
