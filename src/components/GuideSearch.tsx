"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { EVENT } from "@/lib/config";
import {
  MARKETPLACE_LINKS,
  ROCKPORT_GUIDES,
  TRIP_STYLE_LABELS,
  type TripStyle,
  searchGuides,
} from "@/lib/guides";
import { formatUsd } from "@/lib/money";

const STYLES: Array<TripStyle | "all"> = [
  "all",
  "inshore",
  "flats",
  "nearshore",
  "fly",
];

const PARTY_SIZES = [0, 2, 3, 4] as const;

function registerHref(captain: string) {
  const params = new URLSearchParams({
    boat: "GUIDED",
    captain,
  });
  return `/register?${params.toString()}`;
}

export function GuideSearch() {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<TripStyle | "all">("all");
  const [minGuests, setMinGuests] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () =>
      searchGuides(ROCKPORT_GUIDES, {
        query: deferredQuery,
        style,
        minGuests: minGuests || undefined,
      }),
    [deferredQuery, style, minGuests],
  );

  const inputClass =
    "w-full border border-wave/20 bg-paper px-3 py-2.5 text-ink outline-none ring-sun/30 focus:ring-2";
  const labelClass =
    "block font-display text-xs font-semibold uppercase tracking-[0.14em] text-wave/80";

  return (
    <div className="space-y-10">
      <form
        className="space-y-4"
        onSubmit={(e) => e.preventDefault()}
        role="search"
        aria-label="Search Rockport fishing guides"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="section-banner">Guide search</span>
          <span className="stamp text-sea">Rockport, TX</span>
        </div>

        <div>
          <label className={labelClass} htmlFor="guide-query">
            Search captains
          </label>
          <input
            id="guide-query"
            className={`${inputClass} mt-1.5`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Captain, species, marina, or style…"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="guide-style">
              Trip style
            </label>
            <select
              id="guide-style"
              className={`${inputClass} mt-1.5`}
              value={style}
              onChange={(e) => setStyle(e.target.value as TripStyle | "all")}
            >
              {STYLES.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "Any style" : TRIP_STYLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="guide-party">
              Party size
            </label>
            <select
              id="guide-party"
              className={`${inputClass} mt-1.5`}
              value={minGuests}
              onChange={(e) => setMinGuests(Number(e.target.value))}
            >
              {PARTY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size === 0
                    ? "Any size"
                    : `Fits at least ${size} anglers`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <div>
        <p className="font-display text-xs uppercase tracking-[0.14em] text-wave/60">
          {results.length} guide{results.length === 1 ? "" : "s"} match
          {deferredQuery.trim() ? ` “${deferredQuery.trim()}”` : ""}
        </p>

        {results.length === 0 ? (
          <div className="mt-6 border border-dashed border-wave/30 bg-mist/60 px-5 py-8 text-center">
            <p className="font-display text-xl uppercase text-wave">
              No guides matched
            </p>
            <p className="mt-2 text-ink/70">
              Try a broader search, or browse a Rockport charter marketplace.
            </p>
            <ul className="mt-5 flex flex-col items-center gap-2">
              {MARKETPLACE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sea underline-offset-4 hover:underline"
                  >
                    {link.label} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-6 space-y-5">
            {results.map((guide, index) => (
              <li
                key={guide.id}
                className="animate-rise border border-wave/15 bg-paper/80 px-4 py-5 md:px-5"
                style={{ animationDelay: `${Math.min(index, 6) * 0.05}s` }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl uppercase tracking-wide text-wave">
                        {guide.name}
                      </h2>
                      <span className="section-banner-coral px-2 py-0.5 text-[0.65rem] tracking-[0.1em]">
                        From {formatUsd(guide.startingFromUsd * 100)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-sea">
                      {guide.captain} · {guide.marinaArea}
                    </p>
                    <p className="mt-3 max-w-2xl text-ink/75">{guide.summary}</p>
                    <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink/65">
                      <div>
                        <dt className="sr-only">Styles</dt>
                        <dd className="font-display uppercase tracking-[0.08em]">
                          {guide.styles
                            .map((s) => TRIP_STYLE_LABELS[s])
                            .join(" · ")}
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Capacity</dt>
                        <dd>
                          Up to {guide.maxGuests} · {guide.boatLengthFt} ft
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-sm text-ink/55">
                      Targets {guide.species.join(", ")}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                    <a
                      href={guide.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-sun px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-paper transition hover:brightness-105"
                    >
                      Check availability
                    </a>
                    {guide.websiteUrl && guide.websiteUrl !== guide.bookingUrl ? (
                      <a
                        href={guide.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center border-2 border-wave bg-transparent px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-wave transition hover:bg-wave hover:text-paper"
                      >
                        Website
                      </a>
                    ) : null}
                    <Link
                      href={registerHref(guide.captain)}
                      className="inline-flex items-center justify-center border-2 border-wave bg-transparent px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-wave transition hover:bg-wave hover:text-paper"
                    >
                      Use for registration
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="border-t border-dashed border-wave/25 pt-8">
        <h2 className="font-display text-2xl uppercase text-wave">
          Browse more captains
        </h2>
        <p className="mt-2 max-w-2xl text-ink/70">
          Confirm {EVENT.dateLabel} availability and boat capacity before you
          register as a guided team. Marketplaces below list additional captains.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {MARKETPLACE_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sea underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
