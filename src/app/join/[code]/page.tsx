import { redirect } from "next/navigation";
import { isInviteCodeFormat, teamInviteSharePath } from "@/lib/team-invite-code";

export const dynamic = "force-dynamic";

export default async function JoinCodeAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string; name?: string }>;
}) {
  const { code } = await params;
  const { email = "", name = "" } = await searchParams;
  if (!isInviteCodeFormat(code)) {
    redirect("/join");
  }
  const paramsOut = new URLSearchParams();
  if (email.trim()) paramsOut.set("email", email.trim());
  if (name.trim()) paramsOut.set("name", name.trim());
  const query = paramsOut.toString();
  redirect(query ? `${teamInviteSharePath(code)}?${query}` : teamInviteSharePath(code));
}
