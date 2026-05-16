import Link from "next/link";
import { cookies } from "next/headers";
import { getMessages, getLocale } from "@/lib/i18n/locale";

export default async function HowItWorksPage() {
  const m = getMessages(getLocale(await cookies())).howItWorks;

  const sections = [
    { title: m.sectionRulesTitle, href: "/rules", text: m.sectionRulesText },
    { title: m.sectionBetsTitle, href: "/bets", text: m.sectionBetsText },
    { title: m.sectionWmTitle, href: "/wm-sieger-2026", text: m.sectionWmText },
    { title: m.sectionLeaderboardTitle, href: "/leaderboard", text: m.sectionLeaderboardText },
    { title: m.sectionDashboardTitle, href: "/dashboard", text: m.sectionDashboardText },
  ] as const;

  return (
    <main
      className="relative flex flex-1 items-start bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{m.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-100">
          {m.introBefore}{" "}
          <Link
            href="/rules"
            className="font-medium text-white underline decoration-white/60 underline-offset-2 hover:decoration-white"
          >
            {m.introLink}
          </Link>
          {m.introAfter}
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
