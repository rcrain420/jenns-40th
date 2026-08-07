"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { EVENT } from "@/lib/config";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/rules", label: "Tournament Rules" },
  { href: "/pots", label: "Pot Total" },
  { href: "/guides", label: "Guides" },
  { href: "/catches", label: "Livewell" },
] as const;

export function SiteHeader({
  tone = "invert",
  variant = "bar",
}: {
  /** light = navy on parchment; invert = cream on navy */
  tone?: "light" | "invert";
  /** bar = solid navy strip (Bay Bash); overlay = absolute over hero (legacy pages) */
  variant?: "bar" | "overlay";
}) {
  const pathname = usePathname();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const invert = tone === "invert" || variant === "bar";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
    return [
      "font-label tracking-[0.14em] transition",
      active ? "text-paper" : "text-paper/70 hover:text-paper",
    ].join(" ");
  };

  return (
    <header
      className={
        variant === "bar"
          ? "relative z-40 bg-wave text-paper"
          : `absolute inset-x-0 top-0 z-30 ${invert ? "text-paper" : "text-wave"}`
      }
    >
      <div
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 md:h-[3.875rem] md:px-10 ${
          variant === "overlay" ? "py-4 md:py-5" : ""
        }`}
      >
        <Link
          href="/"
          className="min-w-0 font-display text-[0.72rem] leading-tight tracking-[0.06em] sm:text-[0.85rem] md:text-[1.05rem] md:tracking-[0.08em]"
        >
          {EVENT.brandNav}
        </Link>

        <div className="flex items-center gap-3">
          <nav
            className="hidden items-center gap-6 lg:flex"
            aria-label="Main"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[0.95rem] ${linkClass(item.href)}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="font-label text-[0.95rem] tracking-[0.14em] text-paper/45 transition hover:text-paper"
            >
              Admin
            </Link>
          </nav>

          <NotificationBell tone="invert" />

          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={`block h-0.5 w-5 bg-paper transition ${
                open ? "translate-y-[4px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-paper transition ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-paper transition ${
                open ? "-translate-y-[4px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {open ? (
        <div
          id={menuId}
          className="border-t border-paper/20 bg-wave px-5 pb-5 pt-3 lg:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[1rem] ${linkClass(item.href)}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="font-label text-[1rem] tracking-[0.14em] text-paper/45"
            >
              Admin
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
