import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export async function PageShell({
  eyebrow,
  title,
  description,
  children,
  narrow = false,
  wide = false,
  backHref = "/",
  backLabel = "← Back to event home",
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  narrow?: boolean;
  wide?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  const width = narrow ? "max-w-2xl" : wide ? "max-w-5xl" : "max-w-4xl";
  const account = await getCurrentUser();

  return (
    <main className="flex-1">
      <SiteHeader account={account} />
      <div className="relative bg-wave pb-16 pt-10 text-paper">
        <div className={`mx-auto ${width} px-5 md:px-8`}>
          {eyebrow ? (
            <p className="animate-rise font-label text-sm tracking-[0.18em] text-paper/70">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="animate-rise mt-2 font-display text-4xl leading-tight tracking-[0.04em] md:text-5xl">
            {title}
          </h1>
          {description ? (
            <div className="animate-rise-delay mt-3 max-w-xl text-paper/85">
              {description}
            </div>
          ) : null}
        </div>
      </div>

      <div className={`mx-auto ${width} px-5 pb-20 md:px-8`}>
        <div className="double-frame paper-panel -mt-8 px-5 py-8 md:px-8">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-ink/55">
          <Link
            href={backHref}
            className="font-display uppercase tracking-[0.12em] text-sun hover:underline"
          >
            {backLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
