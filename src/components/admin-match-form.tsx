"use client";

import { FormEvent, useState } from "react";
import { usePersistedDetailsOpen } from "@/hooks/use-persisted-details-open";
import {
  EXACT_SCORE_AWAY_WINS,
  EXACT_SCORE_DRAWS,
  EXACT_SCORE_HOME_WINS,
  EXACT_SCORE_ORDERED_OUTCOMES,
} from "@/lib/exact-score";
import { WORLD_CUP_GROUP_CODES, inferWorldCupGroupCode } from "@/lib/world-cup-groups";

const NEW_MATCH_DETAILS_STORAGE_KEY = "kicktipp-admin-new-match-details-open";

export function AdminMatchForm() {
  const { open: detailsOpen, onToggle: onDetailsToggle } = usePersistedDetailsOpen(
    NEW_MATCH_DETAILS_STORAGE_KEY,
    true,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isKnockout, setIsKnockout] = useState(false);
  const [goalsRowStart, setGoalsRowStart] = useState(1);
  const [goalsRowCount, setGoalsRowCount] = useState(5);
  const [cardsRowStart, setCardsRowStart] = useState(0);
  const [cardsRowCount, setCardsRowCount] = useState(9);
  const [cornersRowStart, setCornersRowStart] = useState(0);
  const [cornersRowCount, setCornersRowCount] = useState(9);
  const [handicapHomeRowCount, setHandicapHomeRowCount] = useState(5);
  const [handicapAwayRowCount, setHandicapAwayRowCount] = useState(5);
  const [homeTeam, setHomeTeam] = useState("Deutschland");
  const [awayTeam, setAwayTeam] = useState("Ukraine");
  const inferredGroupCode = inferWorldCupGroupCode(homeTeam, awayTeam);
  const [manualGroupCode, setManualGroupCode] = useState<string>("");
  const selectedGroupCode = manualGroupCode || inferredGroupCode || "";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const form = event.currentTarget;

    const formData = new FormData(form);

    const payload = {
      homeTeam: String(formData.get("homeTeam") ?? ""),
      awayTeam: String(formData.get("awayTeam") ?? ""),
      groupCode: selectedGroupCode || null,
      startsAt: new Date(String(formData.get("startsAt") ?? "")).toISOString(),
      isKnockout: String(formData.get("isKnockout") ?? "no") === "yes",
      odds: {
        oneXTwo: {
          home: Number(formData.get("odd1")),
          draw: Number(formData.get("oddX")),
          away: Number(formData.get("odd2")),
        },
        halfTimeFullTime: {
          oneOne: Number(formData.get("oddHtFt11")),
          oneX: Number(formData.get("oddHtFt1X")),
          oneTwo: Number(formData.get("oddHtFt12")),
          xOne: Number(formData.get("oddHtFtX1")),
          xX: Number(formData.get("oddHtFtXX")),
          xTwo: Number(formData.get("oddHtFtX2")),
          twoOne: Number(formData.get("oddHtFt21")),
          twoX: Number(formData.get("oddHtFt2X")),
          twoTwo: Number(formData.get("oddHtFt22")),
        },
        exactScore: (() => {
          const row: Record<string, number> = {};
          for (const outcome of EXACT_SCORE_ORDERED_OUTCOMES) {
            const fieldKey = `es_${outcome.replace(":", "_")}`;
            row[outcome] = Number(formData.get(fieldKey));
          }
          return row;
        })(),
        goalsMatrixStart: Number(formData.get("goalsMatrixStart")),
        goalsMatrixRowCount: Number(formData.get("goalsMatrixRowCount")),
        goalsMatrix: (() => {
          const gStart = Number(formData.get("goalsMatrixStart"));
          const gCount = Number(formData.get("goalsMatrixRowCount"));
          return Array.from({ length: gCount }, (_, i) => {
            const n = gStart + i;
            return {
              unter: Number(formData.get(`oddGoalsU${i}`)),
              exakt: Number(formData.get(`oddGoalsE${i}`)),
              uber: Number(formData.get(`oddGoalsO${i}`)),
              n,
            };
          });
        })(),
        bothTeamsToScore: {
          yes: Number(formData.get("oddBttsYes")),
          no: Number(formData.get("oddBttsNo")),
        },
        handicapMatrixHomeRowCount: Number(formData.get("handicapMatrixHomeRowCount")),
        handicapMatrixAwayRowCount: Number(formData.get("handicapMatrixAwayRowCount")),
        handicapMatrix: (() => {
          const homeCount = Number(formData.get("handicapMatrixHomeRowCount"));
          const awayCount = Number(formData.get("handicapMatrixAwayRowCount"));
          return [
            ...Array.from({ length: homeCount }, (_, i) => ({
              homeHandicap: i + 1,
              awayHandicap: 0,
              home: Number(formData.get(`oddHandicapHomeH${i}`)),
              draw: Number(formData.get(`oddHandicapHomeX${i}`)),
              away: Number(formData.get(`oddHandicapHomeA${i}`)),
            })),
            ...Array.from({ length: awayCount }, (_, i) => ({
              homeHandicap: 0,
              awayHandicap: i + 1,
              home: Number(formData.get(`oddHandicapAwayH${i}`)),
              draw: Number(formData.get(`oddHandicapAwayX${i}`)),
              away: Number(formData.get(`oddHandicapAwayA${i}`)),
            })),
          ];
        })(),
        cardsMatrixStart: Number(formData.get("cardsMatrixStart")),
        cardsMatrixRowCount: Number(formData.get("cardsMatrixRowCount")),
        cardsMatrix: (() => {
          const kStart = Number(formData.get("cardsMatrixStart"));
          const kCount = Number(formData.get("cardsMatrixRowCount"));
          return Array.from({ length: kCount }, (_, i) => {
            const n = kStart + i;
            const exakt = Number(formData.get(`oddCardsE${i}`));
            const uber = Number(formData.get(`oddCardsO${i}`));
            if (n === 0) {
              return { exakt, uber };
            }
            return {
              unter: Number(formData.get(`oddCardsU${i}`)),
              exakt,
              uber,
            };
          });
        })(),
        cornersMatrixStart: Number(formData.get("cornersMatrixStart")),
        cornersMatrixRowCount: Number(formData.get("cornersMatrixRowCount")),
        cornersMatrix: (() => {
          const cStart = Number(formData.get("cornersMatrixStart"));
          const cCount = Number(formData.get("cornersMatrixRowCount"));
          return Array.from({ length: cCount }, (_, i) => {
            const n = cStart + i;
            const exakt = Number(formData.get(`oddCornersE${i}`));
            const uber = Number(formData.get(`oddCornersO${i}`));
            if (n === 0) {
              return { exakt, uber };
            }
            return {
              unter: Number(formData.get(`oddCornersU${i}`)),
              exakt,
              uber,
            };
          });
        })(),
        ...(String(formData.get("isKnockout") ?? "no") === "yes"
          ? {
              toQualify: {
                homeEt: Number(formData.get("oddQualifyHomeEt")),
                awayEt: Number(formData.get("oddQualifyAwayEt")),
                homePen: Number(formData.get("oddQualifyHomePen")),
                awayPen: Number(formData.get("oddQualifyAwayPen")),
              },
            }
          : {}),
      },
    };

    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Spiel konnte nicht erstellt werden.");
      setLoading(false);
      return;
    }

    form.reset();
    setHomeTeam("Deutschland");
    setAwayTeam("Ukraine");
    setManualGroupCode("");
    setGoalsRowStart(1);
    setGoalsRowCount(5);
    setCardsRowStart(0);
    setCardsRowCount(9);
    setCornersRowStart(0);
    setCornersRowCount(9);
    setHandicapHomeRowCount(5);
    setHandicapAwayRowCount(5);
    setMessage("Spiel und Märkte wurden veröffentlicht und sind jetzt im Reiter Tipps sichtbar.");
    setLoading(false);
  }

  return (
    <details
      className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
      open={detailsOpen}
      onToggle={onDetailsToggle}
    >
      <summary className="cursor-pointer text-xl font-semibold text-zinc-900">
        Neues Spiel eintragen
      </summary>
      <form className="mt-4 space-y-5 text-zinc-900" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Heimteam</label>
          <input
            name="homeTeam"
            value={homeTeam}
            onChange={(event) => setHomeTeam(event.target.value)}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Auswärtsteam</label>
          <input
            name="awayTeam"
            value={awayTeam}
            onChange={(event) => setAwayTeam(event.target.value)}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Gruppe (automatisch erkannt)</label>
          <input
            value={inferredGroupCode ? `Gruppe ${inferredGroupCode}` : "Keine eindeutige Gruppe erkannt"}
            readOnly
            className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Gruppe manuell überschreiben (optional)</label>
          <select
            value={manualGroupCode}
            onChange={(event) => setManualGroupCode(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          >
            <option value="">Automatisch ({inferredGroupCode ? `Gruppe ${inferredGroupCode}` : "keine"})</option>
            {WORLD_CUP_GROUP_CODES.map((groupCode) => (
              <option key={groupCode} value={groupCode}>
                Gruppe {groupCode}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Anstoßzeit</label>
        <input
          name="startsAt"
          type="datetime-local"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">KO-Spiel</label>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="isKnockout"
              value="no"
              checked={!isKnockout}
              onChange={() => setIsKnockout(false)}
            />
            Nein
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="isKnockout"
              value="yes"
              checked={isKnockout}
              onChange={() => setIsKnockout(true)}
            />
            Ja
          </label>
        </div>
      </div>

      {isKnockout ? (
        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Methode des Sieges</legend>
          <p className="text-xs text-zinc-600">
            Vier Quoten: Sieg in der Verlängerung bzw. nach Elfmeterschießen je Heim- und Gastmannschaft. Bei der
            Auswertung gibst du an, ob die Partie in der regulären Zeit, in der Verlängerung oder erst im Elfmeterschießen
            entschieden wurde.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-800">In Verlängerung – Heim</label>
              <input
                name="oddQualifyHomeEt"
                type="number"
                step="0.01"
                min="1.01"
                max={1000}
                required={isKnockout}
                placeholder="Quote"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-800">In Verlängerung – Gast</label>
              <input
                name="oddQualifyAwayEt"
                type="number"
                step="0.01"
                min="1.01"
                max={1000}
                required={isKnockout}
                placeholder="Quote"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-800">Nach Elfmeterschießen – Heim</label>
              <input
                name="oddQualifyHomePen"
                type="number"
                step="0.01"
                min="1.01"
                max={1000}
                required={isKnockout}
                placeholder="Quote"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-800">Nach Elfmeterschießen – Gast</label>
              <input
                name="oddQualifyAwayPen"
                type="number"
                step="0.01"
                min="1.01"
                max={1000}
                required={isKnockout}
                placeholder="Quote"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
              />
            </div>
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">1X2</legend>
          <div className="mt-2 grid gap-2">
            <input name="odd1" type="number" step="0.01" min="1.01" placeholder="Quote 1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddX" type="number" step="0.01" min="1.01" placeholder="Quote X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="odd2" type="number" step="0.01" min="1.01" placeholder="Quote 2" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Halbzeit / Endstand</legend>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <input name="oddHtFt11" type="number" step="0.01" min="1.01" placeholder="1/1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt1X" type="number" step="0.01" min="1.01" placeholder="1/X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt12" type="number" step="0.01" min="1.01" placeholder="1/2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFtX1" type="number" step="0.01" min="1.01" placeholder="X/1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFtXX" type="number" step="0.01" min="1.01" placeholder="X/X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFtX2" type="number" step="0.01" min="1.01" placeholder="X/2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt21" type="number" step="0.01" min="1.01" placeholder="2/1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt2X" type="number" step="0.01" min="1.01" placeholder="2/X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt22" type="number" step="0.01" min="1.01" placeholder="2/2" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3 md:col-span-2">
          <legend className="px-2 text-sm font-semibold">Exact Score</legend>
          <p className="mb-3 text-xs text-zinc-600">
            Drei Spalten: Heimsiege, Unentschieden, Auswärtssiege (Format <strong>Heim : Gast</strong>).
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <p className="border-b border-zinc-200 pb-2 text-center text-sm font-semibold text-black">{homeTeam}</p>
              <div className="mt-2 space-y-2">
                {EXACT_SCORE_HOME_WINS.map((outcome) => (
                  <label key={outcome} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 tabular-nums text-xs font-medium text-zinc-800">{outcome}</span>
                    <input
                      name={`es_${outcome.replace(":", "_")}`}
                      type="number"
                      step="0.01"
                      min="1.01"
                      required
                      placeholder="Quote"
                      className="min-w-0 flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="border-b border-zinc-200 pb-2 text-center text-sm font-semibold text-black">
                Unentschieden
              </p>
              <div className="mt-2 space-y-2">
                {EXACT_SCORE_DRAWS.map((outcome) => (
                  <label key={outcome} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 tabular-nums text-xs font-medium text-zinc-800">{outcome}</span>
                    <input
                      name={`es_${outcome.replace(":", "_")}`}
                      type="number"
                      step="0.01"
                      min="1.01"
                      required
                      placeholder="Quote"
                      className="min-w-0 flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="border-b border-zinc-200 pb-2 text-center text-sm font-semibold text-black">{awayTeam}</p>
              <div className="mt-2 space-y-2">
                {EXACT_SCORE_AWAY_WINS.map((outcome) => (
                  <label key={outcome} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 tabular-nums text-xs font-medium text-zinc-800">{outcome}</span>
                    <input
                      name={`es_${outcome.replace(":", "_")}`}
                      type="number"
                      step="0.01"
                      min="1.01"
                      required
                      placeholder="Quote"
                      className="min-w-0 flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border-2 border-zinc-400 bg-zinc-50/70 p-4 md:col-span-2">
          <legend className="px-2 text-base font-semibold text-zinc-900">Über / Unter Tore</legend>
          <p className="mb-4 text-xs text-zinc-600">
            Gesamttore (Regelzeit) – pro Zeile getrennte Quoten für Unter, Exakt und Über.
          </p>
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Erste Toranzahl</label>
              <input
                name="goalsMatrixStart"
                type="number"
                min={1}
                max={30}
                required
                value={goalsRowStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setGoalsRowStart(Math.min(30, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Anzahl Zeilen</label>
              <input
                name="goalsMatrixRowCount"
                type="number"
                min={1}
                max={15}
                required
                value={goalsRowCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setGoalsRowCount(Math.min(15, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-semibold text-zinc-800">Tore</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Unter</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Exakt</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Über</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: goalsRowCount }, (_, i) => {
                  const n = goalsRowStart + i;
                  return (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-zinc-900">{n}</td>
                      <td className="px-2 py-1.5">
                        <input name={`oddGoalsU${i}`} type="number" step="0.01" min="1.01" max={1000} required placeholder="Quote" className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input name={`oddGoalsE${i}`} type="number" step="0.01" min="1.01" max={1000} required placeholder="Quote" className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input name={`oddGoalsO${i}`} type="number" step="0.01" min="1.01" max={1000} required placeholder="Quote" className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Beide Teams treffen</legend>
          <div className="mt-2 grid gap-2">
            <input name="oddBttsYes" type="number" step="0.01" min="1.01" placeholder="Quote Ja" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddBttsNo" type="number" step="0.01" min="1.01" placeholder="Quote Nein" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-4 md:col-span-2">
          <legend className="px-2 text-base font-semibold text-zinc-900">Handicap</legend>
          <p className="mb-3 text-xs text-zinc-600">
            Vorteil für die Heimmannschaft (<strong>1:0</strong>, <strong>2:0</strong> …) und für die Auswärtsmannschaft
            (<strong>0:1</strong>, <strong>0:2</strong> …) getrennt einstellbar. Pro Zeile je eine Quote für Heim,
            Unentschieden und Auswärts nach angewendetem Handicap.
          </p>
          <div className="mb-4 flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Zeilen Heim ({homeTeam || "Heim"})
              </label>
              <input
                name="handicapMatrixHomeRowCount"
                type="number"
                min={1}
                max={15}
                required
                value={handicapHomeRowCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setHandicapHomeRowCount(Math.min(15, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">1:0 bis {handicapHomeRowCount}:0</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Zeilen Auswärts ({awayTeam || "Gast"})
              </label>
              <input
                name="handicapMatrixAwayRowCount"
                type="number"
                min={1}
                max={15}
                required
                value={handicapAwayRowCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setHandicapAwayRowCount(Math.min(15, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">0:1 bis 0:{handicapAwayRowCount}</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-semibold text-black">Handicap</th>
                  <th className="px-3 py-2 font-semibold text-black">Heim ({homeTeam || "Heimteam"})</th>
                  <th className="px-3 py-2 font-semibold text-black">Unentschieden</th>
                  <th className="px-3 py-2 font-semibold text-black">Auswärts ({awayTeam || "Auswärtsteam"})</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...Array.from({ length: handicapHomeRowCount }, (_, i) => ({
                    key: `home-${i}`,
                    label: `${i + 1}:0`,
                    fieldPrefix: "Home",
                    index: i,
                  })),
                  ...Array.from({ length: handicapAwayRowCount }, (_, i) => ({
                    key: `away-${i}`,
                    label: `0:${i + 1}`,
                    fieldPrefix: "Away",
                    index: i,
                  })),
                ].map((row) => {
                  return (
                    <tr key={row.key} className="border-b border-zinc-100">
                      <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-black">
                        {row.label}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddHandicap${row.fieldPrefix}H${row.index}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddHandicap${row.fieldPrefix}X${row.index}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddHandicap${row.fieldPrefix}A${row.index}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-4 md:col-span-2">
          <legend className="px-2 text-base font-semibold text-zinc-900">Kort</legend>
          <p className="mb-3 text-xs text-zinc-600">
            Gesamtzahl Kort (nach eurer Zählregel). Pro Zeile gilt die Schwelle <strong>N</strong>. Nur wenn die
            kleinste Schwelle <strong>N = 0</strong> ist, entfällt dort „Unter“. Sonst wie bei Hjornespark: Unter / Exakt /
            Über.
          </p>
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Erste Schwelle (N)</label>
              <input
                name="cardsMatrixStart"
                type="number"
                min={0}
                max={30}
                required
                value={cardsRowStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCardsRowStart(Math.min(30, Math.max(0, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">z. B. 0 oder 4</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Anzahl Zeilen</label>
              <input
                name="cardsMatrixRowCount"
                type="number"
                min={1}
                max={15}
                required
                value={cardsRowCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCardsRowCount(Math.min(15, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">1–15</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-semibold text-zinc-800">Schwelle N</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Unter</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Exakt</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Über</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cardsRowCount }, (_, i) => {
                  const n = cardsRowStart + i;
                  return (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-zinc-900">{n}</td>
                      <td className="px-2 py-1.5">
                        {n === 0 ? (
                          <span className="flex h-9 items-center justify-center text-sm text-zinc-400">–</span>
                        ) : (
                          <input
                            name={`oddCardsU${i}`}
                            type="number"
                            step="0.01"
                            min="1.01"
                            max={1000}
                            required
                            placeholder="Quote"
                            className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCardsE${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCardsO${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-4 md:col-span-2">
          <legend className="px-2 text-base font-semibold text-zinc-900">Hjornespark</legend>
          <p className="mb-3 text-xs text-zinc-600">
            Gesamtzahl Hjornespark (nach eurer Zählregel). Pro Zeile gilt die Schwelle <strong>N</strong> (Unter /
            Exakt / Über). Nur wenn die <strong>kleinste Schwelle N = 0</strong> ist, entfällt bei dieser Zeile das
            Feld „Unter“ (nicht sinnvoll). Beginnst du z. B. bei <strong>N = 6</strong>, haben alle Zeilen Unter,
            Exakt und Über.
          </p>
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Erste Schwelle (N)</label>
              <input
                name="cornersMatrixStart"
                type="number"
                min={0}
                max={30}
                required
                value={cornersRowStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCornersRowStart(Math.min(30, Math.max(0, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">z. B. 0 oder 6</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Anzahl Zeilen</label>
              <input
                name="cornersMatrixRowCount"
                type="number"
                min={1}
                max={15}
                required
                value={cornersRowCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCornersRowCount(Math.min(15, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">1–15</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-semibold text-zinc-800">Schwelle N</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Unter</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Exakt</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Über</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cornersRowCount }, (_, i) => {
                  const n = cornersRowStart + i;
                  return (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-zinc-900">{n}</td>
                      <td className="px-2 py-1.5">
                        {n === 0 ? (
                          <span className="flex h-9 items-center justify-center text-sm text-zinc-400">–</span>
                        ) : (
                          <input
                            name={`oddCornersU${i}`}
                            type="number"
                            step="0.01"
                            min="1.01"
                            max={1000}
                            required
                            placeholder="Quote"
                            className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCornersE${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCornersO${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer rounded-md bg-black px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Speichern..." : "Spiel + Quoten veröffentlichen"}
      </button>
    </form>
    </details>
  );
}
