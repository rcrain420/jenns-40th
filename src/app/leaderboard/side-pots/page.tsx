import { SidePotStandings } from "@/components/SidePotStandings";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getSidePotLeaderboard } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Side pot leaders",
};

export default async function SidePotLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const [board, account] = await Promise.all([
    getSidePotLeaderboard(session),
    getCurrentUser(),
  ]);

  return (
    <main className="flex-1 bg-paper text-wave">
      <SiteHeader account={account} />
      <SidePotStandings initial={board} variant="public" pinnedSessionId={session ?? null} />
    </main>
  );
}
