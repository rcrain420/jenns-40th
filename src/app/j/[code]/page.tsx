import { JoinInviteView } from "@/components/JoinInviteView";

export const dynamic = "force-dynamic";

export default async function ShortJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string; name?: string }>;
}) {
  const { code } = await params;
  const { email = "", name = "" } = await searchParams;
  return <JoinInviteView code={code} email={email} name={name} />;
}
