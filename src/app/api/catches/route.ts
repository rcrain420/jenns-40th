import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth";
import {
  createCatchFromUpload,
  listCatchesGroupedByAuthor,
} from "@/lib/catches";
import { guestSafeAiNotes } from "@/lib/guest-copy";

export const runtime = "nodejs";
/** Blob upload + vision estimate. Keep under the client CATCH_SUBMIT_TIMEOUT_MS. */
export const maxDuration = 60;

export async function GET() {
  const groups = await listCatchesGroupedByAuthor();
  return NextResponse.json({
    anglers: groups.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      teamName: a.teamName,
      catches: a.catches.map((c) => ({
        id: c.id,
        photoPath: c.photoPath,
        breed: c.breed,
        lengthInches: c.lengthInches,
        weightLbs: c.weightLbs,
        confidence: c.confidence,
        aiNotes: guestSafeAiNotes(c.aiNotes),
        aiProvider: c.aiProvider,
        createdAt: c.createdAt.toISOString(),
        comments: c.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          authorName: comment.authorName,
        })),
      })),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireVerifiedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Confirm your email to post", needsConfirmation: true },
        { status: 401 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const result = await createCatchFromUpload(formData, user);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      catch: {
        id: result.catch.id,
        photoPath: result.catch.photoPath,
        breed: result.catch.breed,
        lengthInches: result.catch.lengthInches,
        weightLbs: result.catch.weightLbs,
        confidence: result.catch.confidence,
        aiNotes: guestSafeAiNotes(result.catch.aiNotes),
        aiProvider: result.catch.aiProvider,
        createdAt: result.catch.createdAt.toISOString(),
      },
      notify: result.notify,
    });
  } catch (err) {
    console.error("POST /api/catches failed", err);
    return NextResponse.json(
      { error: "Could not log catch. Try again." },
      { status: 500 },
    );
  }
}
