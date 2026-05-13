import Link from "next/link";

const sections = [
  {
    title: "Regelwerk",
    href: "/rules",
    text: "Alles Wichtige zu Spielbudget, Gewinnlimits, Billo-Variante vs. Profi-Tipp und Teilnahme – das ist die ausführliche Fassung.",
  },
  {
    title: "Tipps",
    href: "/bets",
    text: "Hier siehst du die Spiele und gibst deine Tipps ab – entweder in der Billo-Variante (nur Endergebnis) oder in der Profi-Variante mit mehr Auswahl, Quoten und individuellem Punkteeinsatz.",
  },
  {
    title: "WM Sieger 2026",
    href: "/wm-sieger-2026",
    text: "Tippe darauf, welches Team die WM gewinnen wird.",
  },
  {
    title: "Rangliste",
    href: "/leaderboard",
    text: "Alle Teilnehmenden nach Punktestand im Vergleich – sortiert nach dem aktuellen Kontostand.",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    text: "Nach dem Login: Punktekonto, Spielbudget-Übersicht, offene und vergangene Tipps sowie dein Profil (z. B. Bild).",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <main
      className="relative flex flex-1 items-start bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">So funktioniert&apos;s</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-100">
          Kurzüberblick über die Reiter. Spielregeln, Zahlen und Limits stehen im{" "}
          <Link href="/rules" className="font-medium text-white underline decoration-white/60 underline-offset-2 hover:decoration-white">
            Regelwerk
          </Link>
          .
        </p>

        <ul className="mt-6 space-y-3">
          {sections.map((section) => (
            <li
              key={section.href}
              className="rounded-xl border border-zinc-200/80 bg-white p-4 text-zinc-900 shadow-sm"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                <Link href={section.href} className="text-zinc-900 hover:underline">
                  {section.title}
                </Link>
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{section.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
