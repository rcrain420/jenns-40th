import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminSession } from "@/lib/auth";
import { EVENT } from "@/lib/config";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session.isAdmin) {
    redirect("/admin");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="rope-frame paper-panel w-full max-w-md px-6 py-10">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-wave/70">
          Unofficial Fishing Tournament
        </p>
        <p className="font-accent mt-1 text-3xl leading-none text-sun">
          For Jenn&apos;s 40th Birthday
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase text-wave">
          Admin login
        </h1>
        <p className="mt-2 mb-8 text-sm text-ink/65">Organizer access only</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
