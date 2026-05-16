import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { createServerT } from "@/lib/i18n/locale";

export default async function Home() {
  const currentUser = await getCurrentUser();
  const t = createServerT(await cookies());

  return (
    <main
      className="relative flex flex-1 items-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-center gap-8 px-6 py-16 text-white">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight">{t("home.title")}</h1>
        <p className="max-w-3xl text-lg text-zinc-100">{t("home.subtitle")}</p>
        <div className="flex gap-3">
          {currentUser ? (
            <>
              <Link href="/bets" className="rounded-md bg-black px-5 py-2.5 text-white hover:bg-zinc-800">
                {t("home.toBets")}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-white/70 bg-white/10 px-5 py-2.5 hover:bg-white/20"
              >
                {t("home.toDashboard")}
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className="rounded-md bg-black px-5 py-2.5 text-white hover:bg-zinc-800">
                {t("home.register")}
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-white/70 bg-white/10 px-5 py-2.5 hover:bg-white/20"
              >
                {t("home.toLogin")}
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
