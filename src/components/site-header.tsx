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
    ? "block rounded-md px-3 py-2.5 text-base"
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
      { href: "/wm-sieger-2026", label: t("nav.wmWinner") },
      { href: "/leaderboard", label: t("nav.leaderboard") },
      { href: "/dashboard", label: t("nav.dashboard") },
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
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="block shrink-0">
          <Image
            src="/kicktipp-logo.png"
            alt={t("nav.logoAlt")}
            width={130}
            height={50}
            priority
            className="h-9 w-auto mix-blend-multiply md:h-[50px] md:w-[130px]"
          />
        </Link>

        <nav className="hidden items-center gap-3 lg:gap-4 md:flex" aria-label="Hauptnavigation">
          {renderNavLinks(visibleLinks)}
          {sessionUser?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className={navLinkClass(pathname === "/admin")}
            >
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

        <div className="flex items-center gap-2 md:hidden">
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
        <>
          <button
            type="button"
            aria-label={t("nav.menuClose")}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-site-nav"
            className="relative z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-zinc-200 bg-white px-4 py-3 shadow-lg md:hidden"
            aria-label="Hauptnavigation"
          >
            <div className="flex flex-col gap-1">
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
            <div className="mt-3 border-t border-zinc-200 pt-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="w-full cursor-pointer rounded-md border px-3 py-2.5 text-base font-medium text-black"
                >
                  {t("nav.logout")}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md border px-3 py-2.5 text-center text-base font-medium text-black"
                >
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
