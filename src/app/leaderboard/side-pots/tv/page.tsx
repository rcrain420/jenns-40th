import { SidePotStandings } from "@/components/SidePotStandings";
import { getSidePotLeaderboard } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Side pot leaders · TV",
};

export default async function SidePotTvPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const board = await getSidePotLeaderboard(session);
  return <SidePotStandings initial={board} variant="tv" pinnedSessionId={session ?? null} />;
}