import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LineGuessBoard, type LineGuessBoardEntry } from "@/components/LineGuessBoard";
import { LineGuessFrame } from "@/components/LineGuessFrame";
import { LineGuessPinForm } from "@/components/LineGuessPinForm";
import { LineGuessQrActions } from "@/components/LineGuessQrActions";
import { prisma } from "@/lib/db";
import {
  formatGuessFeet,
  formatLineGuessTime,
  lineGuessPinStatus,
  lineGuessTokenMatches,
} from "@/lib/line-guess";
import { lineGuessEntryUrl } from "@/lib/line-guess-origin";
import { lineGuessQrSvg } from "@/lib/line-guess-qr";
import { lineGuessStaffUnlocked } from "@/lib/line-guess-session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  if (!lineGuessTokenMatches(token)) return {};
  return { title: "Line guess tracker" };
}

export default async function LineGuessListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!lineGuessTokenMatches(token)) notFound();

  const pinStatus = lineGuessPinStatus();
  if (pinStatus !== "ok") {
    return (
      <LineGuessFrame eyebrow="Jar table" title="Line guesses" description="Table tracker">
        <p className="text-ink/80">
          {pinStatus === "invalid"
            ? "LINE_GUESS_PIN must be 4–8 digits."
            : "Set LINE_GUESS_PIN on the server to open the tracker."}
        </p>
      </LineGuessFrame>
    );
  }

  const unlocked = await lineGuessStaffUnlocked();
  if (!unlocked) {
    return (
      <LineGuessFrame
        eyebrow="Jar table"
        title="Line guesses"
        description="Table tablet. Enter the PIN to see every guess."
      >
        <LineGuessPinForm token={token} />
      </LineGuessFrame>
    );
  }

  const [rows, entryUrl] = await Promise.all([
    prisma.lineGuess.findMany({
      orderBy: { createdAt: "desc" },
    }),
    lineGuessEntryUrl(token),
  ]);
  let qrSvg: string | null = null;
  try {
    qrSvg = await lineGuessQrSvg(entryUrl);
  } catch (error) {
    console.error("[line-guess] qr", error);
  }

  const entries: LineGuessBoardEntry[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    guessLabel: formatGuessFeet(row.guessFeet),
    paidClaimed: row.paidClaimed,
    method: row.method,
    note: row.note,
    createdLabel: formatLineGuessTime(row.createdAt),
  }));

  return (
    <LineGuessFrame
      eyebrow="Jar table"
      title="Line guesses"
      description="Newest first. Flag a row if someone checked the box without paying."
    >
      <LineGuessBoard token={token} entries={entries} />
      <section className="mt-8 border-t border-[var(--line)] pt-6 print:mt-0 print:border-0 print:pt-0">
        <h2 className="font-display text-2xl text-wave">Jar QR</h2>
        <p className="mt-2 text-sm text-ink/70 print:text-base">
          Print this for the jar table. Guests scan it to open the guess form.
        </p>
        {qrSvg ? (
          <div
            className="mx-auto mt-4 w-56 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : (
          <p className="mt-4 text-sm text-ink/70">
            QR image failed. Copy the URL into a QR generator.
          </p>
        )}
        <p className="mt-3 break-all text-center text-sm text-ink">{entryUrl}</p>
        <LineGuessQrActions entryUrl={entryUrl} />
      </section>
    </LineGuessFrame>
  );
}
