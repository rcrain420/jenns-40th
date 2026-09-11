"use client";

import { useState } from "react";
import { centsToUsdInput, formatUsd, parseUsdToCents } from "@/lib/money";
import {
  derivePaymentStatus,
  paymentBalanceCents,
  paymentStatusLabel,
  remainingBalanceCents,
  type PaymentStatus,
} from "@/lib/payments";

export type AdminPaymentRow = {
  id: string;
  amountCents: number;
  note: string | null;
  source: string;
  createdAt: string;
  createdByUserId: string | null;
  createdByName: string | null;
};

type TeamPaymentPayload = {
  amountPaidCents: number;
  paymentStatus: string;
  payments: Array<{
    id: string;
    amountCents: number;
    note: string | null;
    source: string;
    createdAt: string | Date;
    createdByUserId: string | null;
    createdByUser?: { id: string; name: string } | null;
    createdByName?: string | null;
  }>;
};

type Props = {
  teamId: string;
  savedDueCents: number;
  formDueCents: number;
  initialPaidCents: number;
  initialStatus: PaymentStatus;
  initialPayments: AdminPaymentRow[];
};

function toRows(payments: TeamPaymentPayload["payments"]): AdminPaymentRow[] {
  return payments.map((payment) => ({
    id: payment.id,
    amountCents: payment.amountCents,
    note: payment.note,
    source: payment.source,
    createdAt:
      typeof payment.createdAt === "string"
        ? payment.createdAt
        : payment.createdAt.toISOString(),
    createdByUserId: payment.createdByUserId,
    createdByName:
      payment.createdByName ?? payment.createdByUser?.name ?? null,
  }));
}

function statusClass(status: PaymentStatus): string {
  if (status === "PAID") return "bg-foam/30 text-wave";
  if (status === "PARTIAL") return "bg-sun/15 text-sun";
  return "bg-alert/15 text-alert";
}

export function AdminPaymentLedger({
  teamId,
  savedDueCents,
  formDueCents,
  initialPaidCents,
  initialStatus,
  initialPayments,
}: Props) {
  const [payments, setPayments] = useState(initialPayments);
  const [paidCents, setPaidCents] = useState(initialPaidCents);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const previewStatus = derivePaymentStatus(paidCents, formDueCents);
  const previewBalance = paymentBalanceCents(formDueCents, paidCents);
  const markPaidRemaining = remainingBalanceCents(savedDueCents, paidCents);
  const dueDirty = formDueCents !== savedDueCents;

  const inputClass =
    "mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 outline-none ring-foam/40 focus:ring-2";
  const labelClass = "block text-sm font-medium text-ink/80";

  function applyTeam(team: TeamPaymentPayload) {
    setPaidCents(team.amountPaidCents);
    setSavedStatus(
      team.paymentStatus === "PARTIAL" || team.paymentStatus === "PAID"
        ? team.paymentStatus
        : "UNPAID",
    );
    setPayments(toRows(team.payments));
  }

  async function mutate(
    url: string,
    init: RequestInit,
    onOk?: () => void,
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
      const data = (await res.json()) as {
        error?: string;
        team?: TeamPaymentPayload;
      };
      if (!res.ok || !data.team) {
        setError(data.error ?? "Payment update failed");
        return false;
      }
      applyTeam(data.team);
      onOk?.();
      return true;
    } catch {
      setError("Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onAdd() {
    const amountCents = parseUsdToCents(amount);
    if (amountCents == null) {
      setError("Enter a payment amount greater than zero");
      return;
    }
    await mutate(
      `/api/admin/teams/${teamId}/payments`,
      {
        method: "POST",
        body: JSON.stringify({
          amountCents,
          note: note.trim() || undefined,
        }),
      },
      () => {
        setAmount("");
        setNote("");
      },
    );
  }

  async function onSaveEdit(paymentId: string) {
    const amountCents = parseUsdToCents(editAmount);
    if (amountCents == null) {
      setError("Enter a payment amount greater than zero");
      return;
    }
    await mutate(
      `/api/admin/teams/${teamId}/payments/${paymentId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          amountCents,
          note: editNote.trim() ? editNote.trim() : null,
        }),
      },
      () => setEditingId(null),
    );
  }

  async function onDelete(paymentId: string) {
    if (!confirm("Delete this payment?")) return;
    await mutate(`/api/admin/teams/${teamId}/payments/${paymentId}`, {
      method: "DELETE",
    });
  }

  async function onMarkFullyPaid() {
    if (markPaidRemaining <= 0) return;
    if (
      !confirm(
        `Record ${formatUsd(markPaidRemaining)} as a manual payment for the remaining balance?`,
      )
    ) {
      return;
    }
    await mutate(`/api/admin/teams/${teamId}`, {
      method: "PATCH",
      body: JSON.stringify({ markFullyPaid: true }),
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--line)] bg-mist/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-wave">Payments</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(previewStatus)}`}
        >
          {paymentStatusLabel(previewStatus)}
        </span>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-[0.08em] text-ink/55">
            Due
          </dt>
          <dd className="mt-1 font-semibold text-ink">
            {formatUsd(formDueCents)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.08em] text-ink/55">
            Paid
          </dt>
          <dd className="mt-1 font-semibold text-ink">{formatUsd(paidCents)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.08em] text-ink/55">
            Balance
          </dt>
          <dd className="mt-1 font-semibold text-ink">
            {formatUsd(previewBalance)}
          </dd>
        </div>
      </dl>

      {dueDirty ? (
        <p className="text-sm text-ink/65">
          Save team changes to update the stored due amount. Mark paid uses the
          saved due ({formatUsd(savedDueCents)}).
        </p>
      ) : null}

      <ul className="space-y-3">
        {payments.length === 0 ? (
          <li className="text-sm text-ink/60">No payments recorded yet.</li>
        ) : (
          payments.map((payment) => (
            <li
              key={payment.id}
              className="rounded-md border border-[var(--line)] bg-white px-3 py-3"
            >
              {editingId === payment.id ? (
                <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
                  <div>
                    <label className={labelClass}>Amount</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      aria-label="Edit payment amount"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Note</label>
                    <input
                      className={inputClass}
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      aria-label="Edit payment note"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onSaveEdit(payment.id)}
                      className="text-sm font-semibold text-sea disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingId(null)}
                      className="text-sm text-ink/60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {formatUsd(payment.amountCents)}
                      <span className="ml-2 text-xs font-medium uppercase tracking-[0.08em] text-ink/50">
                        {payment.source}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink/65">
                      {new Date(payment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {payment.createdByName
                        ? ` · ${payment.createdByName}`
                        : ""}
                      {payment.note ? ` · ${payment.note}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(payment.id);
                        setEditAmount(centsToUsdInput(payment.amountCents));
                        setEditNote(payment.note ?? "");
                        setError(null);
                      }}
                      className="text-sm font-semibold text-sea disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDelete(payment.id)}
                      className="text-sm text-alert disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
        <div>
          <label className={labelClass}>Amount</label>
          <input
            className={inputClass}
            inputMode="decimal"
            placeholder="50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Payment amount in dollars"
          />
        </div>
        <div>
          <label className={labelClass}>Note (optional)</label>
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Venmo from…"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAdd()}
            className="rounded-md bg-wave px-4 py-2.5 text-sm font-semibold text-salt hover:bg-ink disabled:opacity-60"
          >
            Add payment
          </button>
        </div>
      </div>

      {markPaidRemaining > 0 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onMarkFullyPaid()}
          className="text-sm font-semibold text-sea disabled:opacity-40"
        >
          Mark fully paid ({formatUsd(markPaidRemaining)} remaining)
        </button>
      ) : savedStatus === "PAID" ? (
        <p className="text-sm text-ink/60">This entry is fully paid.</p>
      ) : null}

      {error ? <p className="text-sm text-alert">{error}</p> : null}
    </div>
  );
}
