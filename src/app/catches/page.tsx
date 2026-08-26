import { CatchGrid } from "@/components/CatchGrid";
import { CatchLogger } from "@/components/CatchLogger";
import { PageShell } from "@/components/PageShell";
import {
  listAnglersForCatchLog,
  listCatchesGroupedByAngler,
} from "@/lib/catches";

export const dynamic = "force-dynamic";

export default async function CatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ unlocked?: string | string[] }>;
}) {
  const [anglers, groups] = await Promise.all([
    listAnglersForCatchLog(),
    listCatchesGroupedByAngler(),
  ]);

  const anglerOptions = anglers.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    teamName: a.team.teamName,
  }));

  const gridAnglers = groups.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    teamName: a.team.teamName,
    catches: a.catches.map((c) => ({
      id: c.id,
      photoPath: c.photoPath,
      breed: c.breed,
      lengthInches: c.lengthInches,
      weightLbs: c.weightLbs,
      confidence: c.confidence,
      createdAt: c.createdAt.toISOString(),
      comments: c.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        angler: comment.angler,
      })),
    })),
  }));

  const totalFish = gridAnglers.reduce((n, a) => n + a.catches.length, 0);
  const params = await searchParams;
  const justUnlocked =
    (Array.isArray(params.unlocked) ? params.unlocked[0] : params.unlocked) ===
    "1";

  return (
    <PageShell
      wide
      title="Livewell"
      description="Snap a photo, fire up the fleet, and keep the trash talk flowing. AI estimates are for fun — not official weigh-in."
    >
      <div className="space-y-12">
        {justUnlocked ? (
          <p
            className="border border-sea/30 bg-mist/80 px-5 py-4 text-ink/80"
            role="status"
          >
            You&apos;re unlocked — log catches, leave comments, and try AI team
            names on this device. No PIN needed.
          </p>
        ) : null}
        <aside className="border border-sun/30 bg-mist/70 px-5 py-5 md:px-6">
          <p className="font-display text-xs uppercase tracking-[0.14em] text-sun">
            For fun · Not weigh-in
          </p>
          <p className="mt-2 text-base leading-relaxed text-ink/80 md:text-lg">
            AI length and weight guesses are{" "}
            <strong>pure entertainment and competitive banter</strong>. They will{" "}
            <strong>not</strong> be used at Boatmen&apos;s weigh-in — the
            Weighmaster&apos;s official scale is the only scale that counts.
            Log catches to keep teams engaged, buzzing, and laughing all day.
          </p>
          <p className="mt-3 text-sm text-ink/60">
            Watch the notification bell up top when somebody drops a photo.
            Tap a fish to leave a comment.
          </p>
        </aside>

        <section>
          <CatchLogger anglers={anglerOptions} />
        </section>

        <section>
          <span className="section-banner">Board by angler</span>
          <p className="mt-3 text-ink/65">
            {totalFish === 0
              ? "Waiting for the first photo of the day — first one on the board rings the bell."
              : `${totalFish} fish logged across ${gridAnglers.length} ${
                  gridAnglers.length === 1 ? "angler" : "anglers"
                }.`}
          </p>
          <div className="mt-6">
            <CatchGrid anglers={gridAnglers} commentAnglers={anglerOptions} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
