import { redirect } from "next/navigation";
import { LineJarAdmin } from "@/components/LineJarAdmin";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orderLineJarGuessesNewestFirst, toLineJarGuessView } from "@/lib/line-jar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Line in the jar",
};

export default async function LineJarAdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/login?next=/admin/line-jar");
  }

  const guesses = orderLineJarGuessesNewestFirst(
    await prisma.lineJarGuess.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  );

  return (
    <main className="flex-1 bg-salt px-5 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <LineJarAdmin rows={guesses.map(toLineJarGuessView)} />
      </div>
    </main>
  );
}
