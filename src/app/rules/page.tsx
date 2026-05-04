export default function RulesPage() {
  return (
    <main
      className="relative flex flex-1 items-start bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">Regelwerk</h1>
        <p className="mt-2 max-w-2xl text-zinc-100">
          So ist das Tippspiel auf dieser Plattform gedacht – Kurzfassung der wichtigsten Regeln.
        </p>

        <div className="mt-6 space-y-8 rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Punkte statt Geld</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Alle Einsätze und Gewinne laufen in <strong>Punkten</strong>. Es gibt keine Echtgeldfunktion, keine
              Einzahlung und keine Auszahlung in Euro – das Spiel dient dem Vergleich und der Rangliste unter den
              Teilnehmenden.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Zwei Arten zu tippen</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Pro Spiel wählst du zwischen der <strong>Billo-Variante</strong> und der <strong>Profi-Variante</strong>
              . Beide nutzen dasselbe Spielbudget für dieses Spiel und fließen in dieselbe Punkte- und Ranglistenlogik
              ein – du entscheidest nur, ob du ein kompaktes Ergebnis abgibst oder selbst Märkte und Einsätze setzt.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
              <li>
                <strong>Billo-Variante:</strong> Du gibst nur das <strong>Endergebnis</strong> (Tore Heim : Tore Gast) ein.
                Die
                Plattform setzt daraus intern automatisch einen Anteil auf das Endstand-1X2 und einen auf „Exakter
                Spielstand“ gemäß den vom Admin hinterlegten Quoten (Liga: 80 + 20 Punkte Einsatz; K.-o.-Spiel: 140 + 60
                Punkte).
              </li>
              <li>
                <strong>Profi:</strong> Du klickst einzelne Quotenfelder an (z.&nbsp;B. 1X2, Über/Unter, Halbzeit,
                exakter Spielstand usw.) und legst pro Tipp den Einsatz in Punkten fest. Es sind nur{" "}
                <strong>Einzelwetten</strong> erlaubt (pro Abgabe genau eine Auswahl). Solange du noch{" "}
                <strong>Spielbudget</strong> hast, kannst du beliebig viele Profi-Tipps zu diesem Spiel setzen – die Summe
                aller Einsätze darf dein Budget für dieses Spiel nicht überschreiten.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Spielbudget pro Spiel</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Für jedes veröffentlichte Spiel bekommst du ein <strong>eigenes Budget nur für dieses Spiel</strong>, das
              zum Setzen deiner Tipps verwendet wird:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
              <li>
                <strong>100 Punkte</strong> bei normalen Spielen (Liga / Gruppe),
              </li>
              <li>
                <strong>200 Punkte</strong> bei als <strong>K.-o.-Spiel</strong> markierten Partien.
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-zinc-700">
              Nicht genutztes Spielbudget nach Ende der Abgabefrist / nach Auswertung kann nicht „mitgenommen“ werden –
              es gilt nur für dieses eine Spiel. Was du aus Gewinnen erhältst, landet auf deinem{" "}
              <strong>Punktekonto</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Quoten und gültige Tipps</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Die Auszahlung bei Gewinn entspricht <strong>Einsatz × Quote</strong> (ganzzahlig gerundet). Auf dein{" "}
              <strong>Punktekonto</strong> werden dagegen nur die <strong>neu hinzukommenden</strong> Punkte gutgeschrieben
              – also der <strong>Nettogewinn</strong> (Auszahlung abzüglich Einsatz), denn der Einsatz war bereits in deinem
              Spielbudget gebunden. Für <strong>alle Märkte außer dem klassischen 1X2</strong> gelten Mindestquoten: auf
              Quoten von <strong>1,20 oder darunter</strong> kann nicht getippt werden. Beim Markt <strong>1X2</strong>{" "}
              sind dagegen <strong>alle Quoten</strong> wählbar. Es gilt das{" "}
              <strong>Ergebnis nach regulärer Spielzeit</strong>, so wie der Admin es bei der Auswertung einträgt.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Gewinnlimits pro Spiel</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Um extreme Ausreißer zu begrenzen, gelten pro Spiel Obergrenzen für die Auszahlung auf dein Punktekonto –
              zuerst max. Gewinn <strong>pro einzelnem gewonnenen Tipp</strong>, zusätzlich eine Deckelung{" "}
              <strong>über alle gewonnenen Tipps dieses Spiels hinweg</strong>:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
              <li>
                <strong>Normales Spiel:</strong> maximal <strong>400</strong> Punkte Gewinn pro Tipp, maximal{" "}
                <strong>600</strong> Punkte Gewinn insgesamt für dieses Spiel.
              </li>
              <li>
                <strong>K.-o.-Spiel:</strong> maximal <strong>600</strong> Punkte Gewinn pro Tipp, maximal{" "}
                <strong>900</strong> Punkte Gewinn insgesamt für dieses Spiel.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">WM-Sieger 2026 (Sonderwette)</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Auf der Seite „WM Sieger 2026“ kannst du – sofern aktiviert – einen Tipp auf den Weltmeister abgeben. Der
              nominelle Einsatz beträgt <strong>100 Punkte</strong>; die Gewinnauszahlung ist auf maximal{" "}
              <strong>2&nbsp;000 Punkte</strong> begrenzt. Details und Abgabefrist siehst du dort direkt auf der Seite.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Teilnahme und Fairness</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              Neue Konten können erst nach <strong>Freigabe durch einen Admin</strong> genutzt werden. Tipps sind nur
              möglich, solange das Spiel noch nicht begonnen hat bzw. die Abgabe vom Spielbetreiber noch nicht
              geschlossen wurde. Änderungen nach Abgabe sind nicht vorgesehen – bitte also vor dem Absenden prüfen.
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
