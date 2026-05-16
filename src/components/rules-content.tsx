import type { Messages } from "@/lib/i18n/messages/de";

export function RulesContent({ m }: { m: Messages["rules"] }) {
  return (
    <div className="mt-6 space-y-8 rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
      <section className="space-y-2">
        <p className="text-sm leading-relaxed text-zinc-700">
          <strong>{m.welcomeStrong}</strong>
        </p>
        <p className="text-sm leading-relaxed text-zinc-700">{m.welcomeP1}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">{m.hTwoWays}</h2>
        <p className="text-sm leading-relaxed text-zinc-700">{m.twoWaysP1}</p>
        <p className="text-sm leading-relaxed text-zinc-700">{m.twoWaysBillo}</p>
        <p className="text-sm leading-relaxed text-zinc-700">{m.twoWaysProfi}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">{m.hBudget}</h2>
        <p className="text-sm leading-relaxed text-zinc-700">{m.budgetP1}</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
          <li>
            <strong>{m.budgetGroup}</strong>
          </li>
          <li>
            <strong>{m.budgetKo}</strong>
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-zinc-700">{m.budgetP2}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">{m.hOdds}</h2>
        <p className="text-sm leading-relaxed text-zinc-700">{m.oddsP1}</p>
        <p className="text-sm leading-relaxed text-zinc-700">{m.oddsP2}</p>
        <p className="text-sm leading-relaxed text-zinc-700">{m.oddsP3}</p>
        <p className="text-sm leading-relaxed text-zinc-700">{m.oddsP4}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">{m.hLimits}</h2>
        <p className="text-sm leading-relaxed text-zinc-700">{m.limitsP1}</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
          <li>
            <strong>{m.limitsGroup}</strong>
          </li>
          <li>
            <strong>{m.limitsKo}</strong>
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">{m.hWm}</h2>
        <p className="text-sm leading-relaxed text-zinc-700">{m.wmP1}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">{m.hParticipation}</h2>
        <p className="text-sm leading-relaxed text-zinc-700">{m.participationP1}</p>
      </section>

      <section
        className="-mx-6 -mb-6 mt-6 rounded-b-xl border-t border-emerald-100 bg-gradient-to-b from-emerald-50/60 to-white px-6 py-3 text-center"
        aria-label={m.footer}
      >
        <img src="/four-leaf-clover.svg" alt="" width={48} height={48} className="mx-auto h-12 w-12" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-emerald-900">{m.footer}</p>
      </section>
    </div>
  );
}
