import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const currentUser = await getCurrentUser();

  return (
    <main
      className="relative flex flex-1 items-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-center gap-8 px-6 py-16 text-white">
        <span className="inline-block w-fit rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-zinc-900">
          Phase 1 aktiv
        </span>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight">
          Moderne Kicktipp-Plattform mit einfachem Einstieg und professioneller Erweiterung
        </h1>
        <p className="max-w-3xl text-lg text-zinc-100">
          Erstelle Tipps, verwalte dein Punktekonto und verfolge später deine Position in der gemeinsamen Rangliste.
        </p>
        <div className="flex gap-3">
          {currentUser ? (
            <>
              <Link href="/bets" className="rounded-md bg-black px-5 py-2.5 text-white hover:bg-zinc-800">
                Zu den Tipps
              </Link>
              <Link href="/dashboard" className="rounded-md border border-white/70 bg-white/10 px-5 py-2.5 hover:bg-white/20">
                Zum Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className="rounded-md bg-black px-5 py-2.5 text-white hover:bg-zinc-800">
                Kostenlos registrieren
              </Link>
              <Link href="/login" className="rounded-md border border-white/70 bg-white/10 px-5 py-2.5 hover:bg-white/20">
                Zum Login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
