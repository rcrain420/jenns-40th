import type { ReactNode } from "react";
import { EVENT } from "@/lib/config";

export function LineGuessFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex-1">
      <header className="bg-wave px-5 pb-16 pt-8 text-paper print:hidden">
        <div className="mx-auto max-w-lg">
          <p className="font-script text-3xl text-paper">{EVENT.shortName}</p>
          <p className="mt-3 font-label text-sm tracking-[0.18em] text-paper/70">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-[0.04em]">
            {title}
          </h1>
          {description ? (
            <div className="mt-3 max-w-md text-base text-paper/85">{description}</div>
          ) : null}
        </div>
      </header>
      <div className="mx-auto max-w-lg px-5 pb-16">
        <div className="paper-panel double-frame -mt-8 px-5 py-6 print:mt-0 print:border-0 print:bg-transparent print:p-0">
          {children}
        </div>
      </div>
    </main>
  );
}
