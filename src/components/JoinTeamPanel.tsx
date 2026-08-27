"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "./AuthForm";
import { notifyAuthChanged } from "@/lib/auth-client";

type Props = {
  token: string;
  teamName: string;
  signedIn: boolean;
};

export function JoinTeamPanel({ token, teamName, signedIn }: Props) {
  const router = useRouter();
  const next = `/join?token=${encodeURIComponent(token)}`;
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(signedIn);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    async function join() {
      try {
        const res = await fetch("/api/team/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as { error?: string; teamName?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Could not join");
          setJoining(false);
          return;
        }
        notifyAuthChanged();
        router.replace("/team?joined=1");
        router.refresh();
      } catch {
        if (!cancelled) {
          setError("Network error — try again");
          setJoining(false);
        }
      }
    }
    void join();
    return () => {
      cancelled = true;
    };
  }, [signedIn, token, router]);

  if (!signedIn) {
    return (
      <div className="space-y-4">
        <p className="text-ink/75">
          Create an account (or sign in) to hop on{" "}
          <strong>{teamName}</strong>. Joining works right away — you do not
          need to confirm email first. Confirming email is only needed later to
          post catches.
        </p>
        <AuthForm next={next} compact />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-ink/75">
        {joining ? `Joining ${teamName}…` : `Join ${teamName} on this account.`}
      </p>
      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
