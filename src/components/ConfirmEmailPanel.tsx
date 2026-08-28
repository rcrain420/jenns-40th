"use client";

import { useRouter } from "next/navigation";
import { notifyAuthChanged } from "@/lib/auth-client";
import { ResendConfirmButton } from "./ResendConfirmButton";

type Props = {
  email: string;
  next?: string;
};

export function ConfirmEmailPanel({ email, next = "/catches" }: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    notifyAuthChanged();
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl bg-white px-5 py-8 shadow-[0_20px_60px_rgba(6,28,40,0.08)] md:px-8">
      <p className="font-display text-xs uppercase tracking-[0.18em] text-sea">
        One tap left
      </p>
      <h2 className="font-display text-2xl text-wave">Check your email</h2>
      <p className="text-ink/75">
        If a confirmation email arrives at <strong>{email}</strong>, tap it to
        post catches and use AI team-name ideas. If you joined a boat from
        Join the boat, you can already post — this confirm is only for
        accounts that have not joined yet. If nothing arrives, try sending a
        new link.
      </p>
      <ResendConfirmButton next={next} />
      <button
        type="button"
        onClick={logout}
        className="text-sm text-ink/55 hover:underline"
      >
        Wrong email? Log out
      </button>
    </div>
  );
}
