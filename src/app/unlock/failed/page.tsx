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
      eyebrow="Livewell"
      title={missing ? "Unlock link needed" : "That link didn't take"}
      description={
        missing
          ? "Open the confirmation email from registration and tap the unlock button."
          : "This unlock link is expired or not valid anymore."
      }
      backHref="/catches"
      backLabel="← Back to the Livewell"
    >
      <div className="space-y-5 text-ink/80">
        <p>
          Lost the email or signing up at Friday&apos;s captain&apos;s meeting?
          The event PIN still unlocks catch logging, comments, and AI team
          names.
        </p>
        <p>
          <Link href="/catches" className="font-semibold text-sea hover:underline">
            Head to the Livewell
          </Link>{" "}
          and enter the PIN there.
        </p>
      </div>
    </PageShell>
  );
}
