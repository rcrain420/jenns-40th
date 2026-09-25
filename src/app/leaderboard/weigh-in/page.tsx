import { SiteHeader } from "@/components/SiteHeader";
import { WeighInStandings } from "@/components/WeighInStandings";
import { getCurrentUser } from "@/lib/auth";
import { getWeighInLeaderboard } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Official weigh-in",
};

export default async function WeighInLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const [board, account] = await Promise.all([
    getWeighInLeaderboard(session),
    getCurrentUser(),
  ]);

  return (
    <main className="flex-1 bg-paper text-wave">
      <SiteHeader account={account} />
      <WeighInStandings initial={board} variant="public" pinnedSessionId={session ?? null} />
    </main>
  );
}
