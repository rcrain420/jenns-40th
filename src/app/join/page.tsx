import { JoinInviteView } from "@/components/JoinInviteView";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; name?: string }>;
}) {
  const { token = "", email = "", name = "" } = await searchParams;
  return (
    <JoinInviteView token={token} email={email} name={name} />
  );
}
