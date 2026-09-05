"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "./AuthForm";
import { notifyAuthChanged } from "@/lib/auth-client";
import { joinTheBoatAuthMode } from "@/lib/join-the-boat";
import { joinReturnPath } from "@/lib/team-invite-code";

type Props = {
  token?: string;
  code?: string;
  teamName: string;
  signedIn: boolean;
  initialEmail?: string;
  initialName?: string;
};

export function JoinTeamPanel({
  token = "",
  code = "",
  teamName,
  signedIn,
  initialEmail = "",
  initialName = "",
}: Props) {
  const router = useRouter();
  const next = joinReturnPath({
    token,
    code,
    email: initialEmail,
    name: initialName,
  });
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
          body: JSON.stringify({ token, code }),
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
  }, [signedIn, token, code, router]);

  if (!signedIn) {
    return (
      <div className="space-y-4">
        <p className="text-ink/75">
          Create an account to hop on <strong>{teamName}</strong>. Use
          Google or Facebook, or set a password for this email. After that
          you are on the boat and can use the Livewell. Joining does not
          make you the captain or add you to the paid roster. Later visits
          can use the same Google, Facebook, or password sign-in.
        </p>
        <AuthForm
          mode={joinTheBoatAuthMode()}
          next={next}
          compact
          initialEmail={initialEmail}
          initialName={initialName}
        />
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
