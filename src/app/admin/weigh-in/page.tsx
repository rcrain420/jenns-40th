import { redirect } from "next/navigation";
import { WeighInConsole } from "@/components/WeighInConsole";
import { getCurrentUser } from "@/lib/auth";
import { getWeighAdminData } from "@/lib/weigh-in";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Official weigh-in",
};

export default async function AdminWeighInPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/login?next=/admin/weigh-in");
  }

  const { session } = await searchParams;
  const data = await getWeighAdminData(session);

  return (
    <main className="flex-1 bg-salt px-5 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <WeighInConsole data={data} />
      </div>
    </main>
  );
}
