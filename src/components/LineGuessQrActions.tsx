"use client";

import { useState } from "react";

export function LineGuessQrActions({ entryUrl }: { entryUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(entryUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="btn-bay btn-bay-navy w-full"
      >
        Print QR
      </button>
      <button
        type="button"
        onClick={() => void copyUrl()}
        className="btn-bay btn-bay-outline w-full"
      >
        {copied ? "Copied" : "Copy entry URL"}
      </button>
    </div>
  );
}
