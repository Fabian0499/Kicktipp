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

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setSessionUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="block">
          <Image
            src="/kicktipp-logo.png"
            alt={t("nav.logoAlt")}
            width={130}
            height={50}
            priority
            className="mix-blend-multiply"
          />
        </Link>
        <nav className="flex items-center gap-4 text-base">
          {links
            .filter((link) => !(isAuthenticated && link.href === "/"))
            .map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={active ? "font-semibold text-black" : "font-medium text-black hover:text-black"}
                >
                  {link.label}
                </Link>
              );
            })}
          {sessionUser?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className={pathname === "/admin" ? "font-semibold text-black" : "font-medium text-black hover:text-black"}
            >
              {t("nav.admin")}
            </Link>
          ) : null}
          <LanguageSelect />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-md border px-3 py-1.5 text-base font-medium text-black hover:text-black"
            >
              {t("nav.logout")}
            </button>
          ) : (
            <Link href="/login" className="rounded-md border px-3 py-1.5 text-base font-medium text-black hover:text-black">
              {t("nav.login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
