"use client";

import { useState } from "react";

type Props = {
  url: string;
  buttonLabel?: string;
};

export function InviteLinkCopy({
  url,
  buttonLabel = "Copy invite link",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="break-all border border-wave/15 bg-paper px-3 py-2.5 font-mono text-sm text-ink">
        <a href={url} className="text-sea underline-offset-2 hover:underline">
          {url}
        </a>
      </p>
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-md bg-wave px-5 py-2.5 text-sm font-semibold text-salt hover:bg-ink"
      >
        {copied ? "Copied" : buttonLabel}
      </button>
    </div>
  );
}
