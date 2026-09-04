"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { UserAvatar } from "@/components/UserAvatar";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-client";
import { EVENT } from "@/lib/config";
import { firstName } from "@/lib/safe-path";
import type { PublicUser } from "@/lib/users";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/kids", label: "Kids" },
  { href: "/rules", label: "Rules" },
  { href: "/pots", label: "Pot Total" },
  { href: "/guides", label: "Guides" },
  { href: "/catches", label: "Livewell" },
] as const;

export function SiteHeader({
  tone = "invert",
  variant = "bar",
  account = null,
}: {
  /** light = navy on parchment; invert = cream on navy */
  tone?: "light" | "invert";
  /** bar = solid navy strip (Bay Bash); overlay = absolute over hero (legacy pages) */
  variant?: "bar" | "overlay";
  account?: PublicUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(account);
  const [returnPath, setReturnPath] = useState(pathname || "/");
  const invert = tone === "invert" || variant === "bar";

  useEffect(() => {
    setOpen(false);
    setReturnPath(`${window.location.pathname}${window.location.search}`);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    async function syncSession() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = (await res.json()) as { user?: PublicUser | null };
        if (!cancelled) setSession(data.user ?? null);
      } catch {
        // keep the last known session
      }
    }
    void syncSession();
    window.addEventListener(AUTH_CHANGED_EVENT, syncSession);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, syncSession);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function logOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setOpen(false);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.refresh();
  }

  const linkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
    return [
      "whitespace-nowrap font-label text-[0.78rem] tracking-[0.08em] transition",
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
        className={`mx-auto flex h-14 max-w-7xl flex-nowrap items-center justify-between gap-4 px-4 md:h-16 md:px-6 ${
          variant === "overlay" ? "py-4 md:py-5" : ""
        }`}
      >
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap font-display text-[0.68rem] tracking-[0.05em] sm:text-[0.8rem] md:text-[0.92rem] md:tracking-[0.06em]"
        >
          {EVENT.brandNav}
        </Link>

        <div className="flex shrink-0 items-center gap-2.5 md:gap-3">
          <nav
            className="hidden items-center gap-x-3.5 xl:flex 2xl:gap-x-4"
            aria-label="Main"
          >
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
            {session?.teamName ? (
              <Link href="/team" className={linkClass("/team")}>
                My team
              </Link>
            ) : null}
            {session?.isAdmin ? (
              <Link
                href="/admin"
                className="whitespace-nowrap font-label text-[0.78rem] tracking-[0.08em] text-paper/45 transition hover:text-paper"
              >
                Admin
              </Link>
            ) : null}
            {session ? (
              <>
                <span className="flex items-center gap-2 pl-1">
                  <UserAvatar name={session.name} imageUrl={session.imageUrl} />
                  <span className="whitespace-nowrap font-label text-[0.78rem] tracking-[0.08em] text-paper">
                    {firstName(session.name)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void logOut()}
                  className="whitespace-nowrap font-label text-[0.78rem] tracking-[0.08em] text-paper/70 transition hover:text-paper"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(returnPath)}`}
                className={linkClass("/login")}
              >
                Log in
              </Link>
            )}
          </nav>

          <NotificationBell tone="invert" />

          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 xl:hidden"
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
          className="border-t border-paper/20 bg-wave px-5 pb-5 pt-3 xl:hidden"
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
            {session?.teamName ? (
              <Link href="/team" className={`text-[1rem] ${linkClass("/team")}`}>
                My team
              </Link>
            ) : null}
            {session?.isAdmin ? (
              <Link
                href="/admin"
                className="font-label text-[1rem] tracking-[0.08em] text-paper/45"
              >
                Admin
              </Link>
            ) : null}
            {session ? (
              <>
                <p className="flex items-center gap-2.5 font-label text-[1rem] tracking-[0.08em] text-paper">
                  <UserAvatar name={session.name} imageUrl={session.imageUrl} size={32} />
                  {firstName(session.name)}
                </p>
                <button
                  type="button"
                  onClick={() => void logOut()}
                  className="text-left font-label text-[1rem] tracking-[0.08em] text-paper/70"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(returnPath)}`}
                className={`text-[1rem] ${linkClass("/login")}`}
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
