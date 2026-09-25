"use client";

import { useEffect, useRef, useState } from "react";
import { formatChicagoClock, WEIGH_POLL_CLOSED_MS, WEIGH_POLL_OPEN_MS } from "@/lib/weigh-scoring";

export function useChicagoClock() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => setLabel(formatChicagoClock(new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return label;
}

type Polled = {
  version: string;
  session: { id: string; status: string } | null;
};

export function usePolledBoard<T extends Polled>(
  initial: T,
  path: string,
  pinnedSessionId?: string | null,
): T {
  const [data, setData] = useState(initial);
  const versionRef = useRef(initial.version);
  const status = data.session?.status ?? "CLOSED";

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const query = pinnedSessionId
          ? `?session=${encodeURIComponent(pinnedSessionId)}`
          : "";
        const res = await fetch(`${path}${query}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const next = (await res.json()) as T;
        if (cancelled || next.version === versionRef.current) return;
        versionRef.current = next.version;
        setData(next);
      } catch {
        // Keep the last good board if the marina network blips.
      }
    }
    const ms = status === "OPEN" ? WEIGH_POLL_OPEN_MS : WEIGH_POLL_CLOSED_MS;
    const timer = window.setInterval(() => void poll(), ms);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [path, pinnedSessionId, status]);

  return data;
}
