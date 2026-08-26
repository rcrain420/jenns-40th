import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/safe-path";

export default async function SignupRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  redirect(`/login?mode=signup&next=${encodeURIComponent(next)}`);
}
