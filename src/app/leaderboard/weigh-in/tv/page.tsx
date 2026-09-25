import { WeighInStandings } from "@/components/WeighInStandings";
import { getWeighInLeaderboard } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Official weigh-in · TV",
};

export default async function WeighInTvPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const board = await getWeighInLeaderboard(session);
  return <WeighInStandings initial={board} variant="tv" pinnedSessionId={session ?? null} />;
}
