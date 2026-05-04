"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Startseite" },
  { href: "/how-it-works", label: "So funktioniert's" },
  { href: "/rules", label: "Regelwerk" },
  { href: "/bets", label: "Tipps" },
  { href: "/wm-sieger-2026", label: "WM Sieger 2026" },
  { href: "/leaderboard", label: "Rangliste" },
  { href: "/dashboard", label: "Dashboard" },
];

type SessionUser = {
  role?: "USER" | "ADMIN";
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

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
        <Link href="/" className="text-lg font-semibold text-black">
          Kicktipp
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links
            .filter((link) => !(isAuthenticated && link.href === "/"))
            .map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "font-semibold text-black" : "text-black/70 hover:text-black"}
              >
                {link.label}
              </Link>
            );
          })}
          {sessionUser?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className={pathname === "/admin" ? "font-semibold text-black" : "text-black/70 hover:text-black"}
            >
              Verwaltung
            </Link>
          ) : null}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-md border px-3 py-1.5 text-black/80 hover:text-black"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="rounded-md border px-3 py-1.5 text-black/80 hover:text-black">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
