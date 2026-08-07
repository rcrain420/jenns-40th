import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminTeamEditor } from "@/components/AdminTeamEditor";
import { getAdminSession } from "@/lib/auth";

export default async function AdminNewTeamPage() {
  const session = await getAdminSession();
  if (!session.isAdmin) redirect("/admin/login");

  return (
    <main className="flex-1 bg-salt px-5 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin" className="text-sm text-sea hover:underline">
          ← All teams
        </Link>
        <h1 className="mt-4 font-display text-3xl text-wave">Add team</h1>
        <p className="mt-2 text-ink/65">
          Admins can add teams even after public registration closes.
        </p>
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <AdminTeamEditor mode="create" />
        </div>
      </div>
    </main>
  );
}
