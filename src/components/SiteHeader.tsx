"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { UserAvatar } from "@/components/UserAvatar";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-client";
import { EVENT } from "@/lib/config";
import { firstName } from "@/lib/safe-path";
import type { PublicUser } from "@/lib/users";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/kids", label: "Youth" },
  { href: "/rules", label: "Rules" },
  { href: "/pots", label: "Pot Total" },
  { href: "/guides", label: "Guides" },
  { href: "/catches", label: "Livewell" },
  { href: "/teams", label: "Teams" },
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

        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <nav
            className="hidden items-center gap-x-3.5 xl:flex 2xl:gap-x-4"
            aria-label="Main"
          >
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
            {session?.isAdmin ? (
              <Link
                href="/admin"
                className="whitespace-nowrap font-label text-[0.78rem] tracking-[0.08em] text-paper/45 transition hover:text-paper"
              >
                Admin
              </Link>
            ) : null}
            {!session ? (
              <Link
                href={`/login?next=${encodeURIComponent(returnPath)}`}
                className={linkClass("/login")}
              >
                Log in
              </Link>
            ) : null}
          </nav>

          {session ? (
            <AccountMenu
              session={session}
              hamburgerOpen={open}
              onLogOut={() => void logOut()}
              onOpen={() => setOpen(false)}
            />
          ) : null}

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
            {session?.isAdmin ? (
              <Link
                href="/admin"
                className="font-label text-[1rem] tracking-[0.08em] text-paper/45"
              >
                Admin
              </Link>
            ) : null}
            {!session ? (
              <Link
                href={`/login?next=${encodeURIComponent(returnPath)}`}
                className={`text-[1rem] ${linkClass("/login")}`}
              >
                Log in
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function AccountMenu({
  session,
  hamburgerOpen,
  onLogOut,
  onOpen,
}: {
  session: PublicUser;
  hamburgerOpen: boolean;
  onLogOut: () => void;
  onOpen: () => void;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const displayName = firstName(session.name);

  useEffect(() => {
    if (hamburgerOpen) setOpen(false);
  }, [hamburgerOpen]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) onOpen();
  }

  const itemClass =
    "block w-full px-3 py-2.5 text-left font-label text-[0.85rem] tracking-[0.08em] text-wave transition hover:bg-mist/70";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-paper/35 transition hover:bg-paper/10"
        aria-label={open ? "Close account menu" : `Account menu for ${displayName}`}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
      >
        <UserAvatar name={session.name} imageUrl={session.imageUrl} size={28} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(16rem,calc(100vw-2rem))] overflow-hidden border border-wave/15 bg-paper text-ink shadow-[0_18px_40px_rgba(26,36,48,0.18)]"
        >
          <div className="border-b border-wave/10 bg-mist/60 px-3 py-2.5">
            <p className="font-display text-xs uppercase tracking-[0.14em] text-wave">
              {displayName}
            </p>
            {session.teamName ? (
              <p className="mt-1 truncate text-xs text-ink/60">{session.teamName}</p>
            ) : null}
          </div>
          <Link
            href="/team"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            My team
          </Link>
          {session.isAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogOut();
            }}
            className={`${itemClass} border-t border-wave/10 text-ink/70`}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
