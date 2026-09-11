import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  deleteManualPayment,
  updateManualPayment,
} from "@/lib/payment-ledger";
import { adminPaymentUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string; paymentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, paymentId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminPaymentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const team = await updateManualPayment({
    teamId: id,
    paymentId,
    amountCents: parsed.data.amountCents,
    note:
      parsed.data.note === undefined
        ? undefined
        : parsed.data.note?.trim()
          ? parsed.data.note.trim()
          : null,
  });
  if (!team) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ team });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, paymentId } = await params;
  const team = await deleteManualPayment({ teamId: id, paymentId });
  if (!team) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ team });
}
