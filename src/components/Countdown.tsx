"use client";

import { useEffect, useState } from "react";
import { remainingUntil } from "@/lib/config";

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type Props = {
  targetIso: string;
  initial: CountdownParts;
};

export function Countdown({ targetIso, initial }: Props) {
  const [parts, setParts] = useState<CountdownParts>(initial);

  useEffect(() => {
    const target = new Date(targetIso);

    const tick = () => {
      const next = remainingUntil(target);
      setParts({
        days: next.days,
        hours: next.hours,
        minutes: next.minutes,
        seconds: next.seconds,
      });
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  const units = [
    {
      value: parts.days,
      labelFull: "DAYS",
      labelShort: "DAYS",
      accent: false,
    },
    {
      value: parts.hours,
      labelFull: "HOURS",
      labelShort: "HRS",
      accent: false,
    },
    {
      value: parts.minutes,
      labelFull: "MINUTES",
      labelShort: "MIN",
      accent: false,
    },
    {
      value: parts.seconds,
      labelFull: "SECONDS",
      labelShort: "SEC",
      accent: true,
    },
  ] as const;

  return (
    <div
      className="flex items-end gap-2 md:gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      {units.map((unit) => (
        <div key={unit.labelFull} className="text-center">
          <div
            className={`min-w-12 bg-paper px-2.5 py-1 font-display text-[1.875rem] md:min-w-[4.1rem] md:px-3.5 md:py-1.5 md:text-[2.75rem] ${
              unit.accent ? "text-sun" : "text-wave"
            }`}
          >
            {pad(unit.value)}
          </div>
          <div className="font-label mt-1 text-[0.7rem] tracking-[0.14em] text-paper md:mt-1.5 md:text-[0.8rem] md:tracking-[0.16em]">
            <span className="md:hidden">{unit.labelShort}</span>
            <span className="hidden md:inline">{unit.labelFull}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
