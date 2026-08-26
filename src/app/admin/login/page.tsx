import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.isAdmin) {
    redirect("/admin");
  }
  redirect("/login?next=/admin");
}
