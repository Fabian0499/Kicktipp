"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LanguageSelect } from "@/components/language-select";
import { useT } from "@/components/locale-provider";

type SessionUser = {
  role?: "USER" | "ADMIN";
};

type NavLinkItem = {
  href: string;
  label: string;
};

function navLinkClass(active: boolean, mobile = false) {
  const base = mobile
    ? "block rounded-md px-3 py-3 text-base"
    : "whitespace-nowrap text-base";
  return active
    ? `${base} font-semibold text-black`
    : `${base} font-medium text-black hover:text-black`;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = useMemo(
    () => [
      { href: "/", label: t("nav.home") },
      { href: "/how-it-works", label: t("nav.howItWorks") },
      { href: "/rules", label: t("nav.rules") },
      { href: "/bets", label: t("nav.bets") },
      { href: "/dashboard", label: t("nav.dashboard") },
      { href: "/wm-sieger-2026", label: t("nav.wmWinner") },
      { href: "/leaderboard", label: t("nav.leaderboard") },
    ],
    [t],
  );

  const visibleLinks = useMemo(
    () => links.filter((link) => !(isAuthenticated && link.href === "/")),
    [isAuthenticated, links],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!isMounted) {
        return;
      }
      if (!response.ok) {
        setIsAuthenticated(false);
        setSessionUser(null);
        return;
      }

      const body = (await response.json().catch(() => null)) as { user?: SessionUser } | null;
      setIsAuthenticated(true);
      setSessionUser(body?.user ?? null);
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  async function handleLogout() {
    setMobileOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setSessionUser(null);
    router.push("/login");
    router.refresh();
  }

  function renderNavLinks(items: NavLinkItem[], mobile = false) {
    return items.map((link) => {
      const active = pathname === link.href;
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setMobileOpen(false)}
          className={navLinkClass(active, mobile)}
        >
          {link.label}
        </Link>
      );
    });
  }

  return (
    <header className="relative z-30 border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-4">
        <Link href="/" className="block shrink-0">
          <Image
            src="/kicktipp-logo.png"
            alt={t("nav.logoAlt")}
            width={130}
            height={50}
            priority
            className="h-9 w-auto mix-blend-multiply lg:h-[50px] lg:w-[130px]"
          />
        </Link>

        <nav className="hidden items-center gap-3 lg:flex lg:gap-4" aria-label="Hauptnavigation">
          {renderNavLinks(visibleLinks)}
          {sessionUser?.role === "ADMIN" ? (
            <Link href="/admin" className={navLinkClass(pathname === "/admin")}>
              {t("nav.admin")}
            </Link>
          ) : null}
          <LanguageSelect />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="cursor-pointer whitespace-nowrap rounded-md border px-3 py-1.5 text-base font-medium text-black hover:text-black"
            >
              {t("nav.logout")}
            </button>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-md border px-3 py-1.5 text-base font-medium text-black hover:text-black"
            >
              {t("nav.login")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSelect />
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-site-nav"
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white text-black"
          >
            <span
              className={`block h-0.5 w-5 rounded-full bg-black transition-transform ${
                mobileOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span className={`block h-0.5 w-5 rounded-full bg-black transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span
              className={`block h-0.5 w-5 rounded-full bg-black transition-transform ${
                mobileOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-site-nav"
          className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Hauptnavigation"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link href="/" className="block shrink-0" onClick={() => setMobileOpen(false)}>
              <Image
                src="/kicktipp-logo.png"
                alt={t("nav.logoAlt")}
                width={130}
                height={50}
                className="h-9 w-auto mix-blend-multiply"
              />
            </Link>
            <button
              type="button"
              aria-label={t("nav.menuClose")}
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-zinc-300 text-xl font-medium text-black"
            >
              ×
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2">
            <div className="flex flex-col gap-0.5">
              {renderNavLinks(visibleLinks, true)}
              {sessionUser?.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass(pathname === "/admin", true)}
                >
                  {t("nav.admin")}
                </Link>
              ) : null}
            </div>
          </nav>

          <div className="shrink-0 border-t border-zinc-200 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full cursor-pointer rounded-md border px-3 py-3 text-base font-medium text-black"
              >
                {t("nav.logout")}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md border px-3 py-3 text-center text-base font-medium text-black"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
