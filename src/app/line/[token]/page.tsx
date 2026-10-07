import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LineGuessForm } from "@/components/LineGuessForm";
import { LineGuessFrame } from "@/components/LineGuessFrame";
import { lineGuessTokenMatches } from "@/lib/line-guess";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  if (!lineGuessTokenMatches(token)) return {};
  return { title: "Fishing line guess" };
}

export default async function LineGuessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!lineGuessTokenMatches(token)) notFound();

  return (
    <LineGuessFrame
      eyebrow="Jar table"
      title="Guess the line"
      description="How many feet of fishing line are in the jar? Donate at least $40, then save your guess."
    >
      <LineGuessForm token={token} />
    </LineGuessFrame>
  );
}
