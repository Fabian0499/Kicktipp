export default function RulesPage() {
  return (
    <main
      className="relative flex min-h-screen flex-1 items-start bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">Regelwerk</h1>
        <p className="mt-2 max-w-2xl text-zinc-100">Kurzfassung – so funktioniert das Tippspiel auf dibiti.</p>

        <div className="mt-6 space-y-8 rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
          <section className="space-y-2">
            <p className="text-sm leading-relaxed text-zinc-700">
              <strong>Willkommen bei dibiti.</strong>
            </p>
            <p className="text-sm leading-relaxed text-zinc-700">
              Unser Tippspiel bietet Dir ein bisschen mehr als nur auf 1X2 (Sieg Team 1 / Remis / Sieg Team 2) und auf ein
              korrektes Endergebnis tippen zu können.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Zwei Arten zu tippen</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Für jedes Spiel kannst Du stets aufs Neue zwischen der <strong>Billo-Variante</strong> und der{" "}
              <strong>Profi-Variante</strong> wählen. Egal wie getippt wird, alle erscheinen in einer Rangliste und die
              Chancen auf Platz 1 sind für alle gleich.
            </p>
            <p className="text-sm leading-relaxed text-zinc-700">
              <strong>Billo-Variante:</strong> Du gibst nur das genaue Endergebnis (Tore Team 1 : Tore Team 2) ein und
              das für jedes Spiel. Das war&apos;s, mehr musst Du nicht machen.
            </p>
            <p className="text-sm leading-relaxed text-zinc-700">
              <strong>Profi-Variante:</strong> Hier wird getippt wie beim Wetten, das heißt, es gibt weitere Tipparten
              (z.&nbsp;B. Karten oder Ecken) mit Quoten und Du bestimmst Deinen Einsatz. Du entscheidest Dich für einen
              Tipp, klickst das dazugehörige Quotenfeld an und legst den Einsatz in Punkten fest. Solange du noch
              Spielbudget hast, kannst du beliebig viele Profi-Tipps zu diesem Spiel setzen, aber nur einen Tipp in
              jeder Tippart.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Spielbudget pro Spiel</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Für jedes Spiel bekommst Du ein eigenes Budget, das zum Setzen Deiner Tipps verwendet wird:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
              <li>
                <strong>100 Punkte</strong> für jedes Spiel in der Gruppenphase
              </li>
              <li>
                <strong>200 Punkte</strong> für jedes Spiel in der KO-Runde
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-zinc-700">
              Nicht genutzte Punkte verfallen. Deine gewonnenen Punkte landen auf deinem Punktekonto.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Quoten und gültige Tipps</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Ist Dein Tipp richtig, errechnet sich Dein (ganzzahlig gerundeter) Gewinn wie folgt: Einsatz × Quote.
            </p>
            <p className="text-sm leading-relaxed text-zinc-700">
              Billo-Tipps werden genauso berechnet, weil diese in Profi-Tipps mit dem immer gleichen Einsatz umgewandelt
              werden. Wer mehr wissen will, wendet sich an die Admins.
            </p>
            <p className="text-sm leading-relaxed text-zinc-700">
              Für alle Tipparten außer der Hauptkategorie 1X2 gilt, dass auf Quoten, die kleiner als 1,20 sind, nicht
              getippt werden kann.
            </p>
            <p className="text-sm leading-relaxed text-zinc-700">
              Es gilt immer das Ergebnis nach Ende der regulären Spielzeit, außer bei der ab der KO-Runde zusätzlichen
              Kategorie, ob sich ein Team nach Verlängerung oder nach Elfmeterschießen qualifiziert.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Gewinnlimits pro Spiel</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Um extreme Ausreißer zu begrenzen, gelten pro Spiel zwei Obergrenzen für mögliche Gewinne: zum einen der
              maximale Gewinn für einen einzelnen Tipp und zudem eine maximale Ausbeute für ein einzelnes Spiel:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
              <li>
                <strong>Gruppenphase:</strong> maximal 400 Punkte Gewinn pro Tipp, maximal 600 Punkte Gewinn insgesamt
                für dieses Spiel.
              </li>
              <li>
                <strong>KO-Runde:</strong> maximal 600 Punkte Gewinn pro Tipp, maximal 900 Punkte Gewinn insgesamt für
                dieses Spiel.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">WM-Sieger 2026 (Sonderwette)</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Auf der Seite „WM Sieger 2026“ kannst Du zusätzlich einen Tipp abgeben, welches Team dieses Turnier
              gewinnen wird. Dein Tipp wird mit 100 Punkten abgegeben und im Erfolgsfall mit der Quote des von Dir
              ausgesuchten Teams multipliziert.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Teilnahme</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Neue Konten können erst nach Freigabe durch einen Admin genutzt werden. Tipps sind nur möglich, solange
              das Spiel noch nicht begonnen hat. Änderungen der Tipps nach Abgabe sind nicht möglich – bitte also vor
              dem Absenden prüfen.
            </p>
          </section>

          <section
            className="border-t border-emerald-100 bg-gradient-to-b from-emerald-50/60 to-white py-3 text-center -mx-6 -mb-6 mt-6 rounded-b-xl px-6"
            aria-label="Abschlussgruß"
          >
            <img
              src="/four-leaf-clover.svg"
              alt=""
              width={48}
              height={48}
              className="mx-auto h-12 w-12"
              aria-hidden
            />
            <p className="mt-2 text-sm font-semibold text-emerald-900">Viel Glück!</p>
          </section>
        </div>
      </div>
    </main>
  );
}
