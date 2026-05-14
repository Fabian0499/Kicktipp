"use client";

import { useState } from "react";

type MatchItem = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  isKnockout: boolean;
  usesQualifyMethodMatrix: boolean;
  homeHalfTimeScore: number | null;
  awayHalfTimeScore: number | null;
  homeScore: number | null;
  awayScore: number | null;
  settledAt: string | null;
  totalCards: number | null;
  totalCorners: number | null;
};

type ScoreFormState = {
  homeHalfTimeScore: string;
  awayHalfTimeScore: string;
  homeScore: string;
  awayScore: string;
  totalCards: string;
  totalCorners: string;
  knockoutDecidedBy: "" | "REGULATION" | "EXTRA_TIME" | "PENALTIES";
  knockoutAdvancingIsHome: "" | "home" | "away";
};

const emptyScore = (): ScoreFormState => ({
  homeHalfTimeScore: "",
  awayHalfTimeScore: "",
  homeScore: "",
  awayScore: "",
  totalCards: "",
  totalCorners: "",
  knockoutDecidedBy: "",
  knockoutAdvancingIsHome: "",
});

export function AdminResultSettlement({ matches }: { matches: MatchItem[] }) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreFormState>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function settle(match: MatchItem) {
    const scoreEntry = scores[match.id] ?? emptyScore();
    const homeHalfTimeScore = Number(scoreEntry.homeHalfTimeScore);
    const awayHalfTimeScore = Number(scoreEntry.awayHalfTimeScore);
    const homeScore = Number(scoreEntry.homeScore);
    const awayScore = Number(scoreEntry.awayScore);
    const totalCards = Number(scoreEntry.totalCards);
    const totalCorners = Number(scoreEntry.totalCorners);

    if (
      !Number.isInteger(homeHalfTimeScore) ||
      !Number.isInteger(awayHalfTimeScore) ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      !Number.isInteger(totalCards) ||
      !Number.isInteger(totalCorners) ||
      homeHalfTimeScore < 0 ||
      awayHalfTimeScore < 0 ||
      homeScore < 0 ||
      awayScore < 0 ||
      totalCards < 0 ||
      totalCorners < 0
    ) {
      setError("Bitte ein gültiges Ergebnis inkl. Kort und Hjornespark (ganze Zahlen) eingeben.");
      setMessage("");
      return;
    }

    if (match.isKnockout && match.usesQualifyMethodMatrix) {
      if (!scoreEntry.knockoutDecidedBy) {
        setError(
          "Für K.-o.-Spiele mit „Methode des Sieges“: Bitte wählen, ob die Entscheidung in der regulären Zeit, in der Verlängerung oder im Elfmeterschießen fiel.",
        );
        setMessage("");
        return;
      }
      if (scoreEntry.knockoutDecidedBy === "PENALTIES") {
        if (homeScore !== awayScore) {
          setError("Elfmeterschießen ist nur bei unentschiedenem Endstand wählbar.");
          setMessage("");
          return;
        }
        if (scoreEntry.knockoutAdvancingIsHome !== "home" && scoreEntry.knockoutAdvancingIsHome !== "away") {
          setError("Bitte angeben, welche Mannschaft nach dem Elfmeterschießen weiterkommt.");
          setMessage("");
          return;
        }
      }
    }

    setSavingId(match.id);
    setError("");
    setMessage("");

    const payload: Record<string, unknown> = {
      homeHalfTimeScore,
      awayHalfTimeScore,
      homeScore,
      awayScore,
      totalCards,
      totalCorners,
    };

    if (match.isKnockout && match.usesQualifyMethodMatrix && scoreEntry.knockoutDecidedBy) {
      payload.knockoutDecidedBy = scoreEntry.knockoutDecidedBy;
      if (scoreEntry.knockoutDecidedBy === "PENALTIES" && homeScore === awayScore) {
        payload.knockoutAdvancingIsHome = scoreEntry.knockoutAdvancingIsHome === "home";
      }
    }

    const response = await fetch(`/api/admin/matches/${match.id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Auswertung fehlgeschlagen.");
      setSavingId(null);
      return;
    }

    const body = (await response.json()) as { settledCount: number };
    setMessage(`Auswertung abgeschlossen. Verarbeitete Tipps: ${body.settledCount}`);
    setSavingId(null);
    window.location.reload();
  }

  return (
    <section className="mt-8 rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
      <h2 className="text-xl font-semibold">Ergebnisse eintragen & auswerten</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Ergebnis eintragen, bestätigen und Gewinne werden automatisch den Wallets gutgeschrieben.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="mt-4 space-y-3">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-600">Keine Spiele vorhanden.</p>
        ) : (
          matches.map((match) => {
            const isSettled = Boolean(match.settledAt);
            const score = scores[match.id] ?? emptyScore();

            return (
              <article key={match.id} className="rounded-md border p-4">
                <p className="font-semibold">
                  {match.homeTeam} vs. {match.awayTeam}
                </p>
                <p className="text-sm text-zinc-600">Anstoß: {new Date(match.startsAt).toLocaleString("de-DE")}</p>
                {isSettled ? (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    Bereits ausgewertet - Halbzeit: {match.homeHalfTimeScore} : {match.awayHalfTimeScore}, Endstand:{" "}
                    {match.homeScore} : {match.awayScore}
                    {match.totalCards != null ? `, Kort gesamt: ${match.totalCards}` : null}
                    {match.totalCorners != null ? `, Hjornespark gesamt: ${match.totalCorners}` : null}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700">Halbzeit</label>
                        <div className="mt-1 flex items-end gap-2">
                          <div>
                            <label className="block text-xs text-zinc-600">{match.homeTeam}</label>
                            <input
                              type="number"
                              min={0}
                              value={score.homeHalfTimeScore}
                              onChange={(event) =>
                                setScores((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...score,
                                    homeHalfTimeScore: event.target.value,
                                  },
                                }))
                              }
                              className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                            />
                          </div>
                          <span className="pb-2 font-semibold">:</span>
                          <div>
                            <label className="block text-xs text-zinc-600">{match.awayTeam}</label>
                            <input
                              type="number"
                              min={0}
                              value={score.awayHalfTimeScore}
                              onChange={(event) =>
                                setScores((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...score,
                                    awayHalfTimeScore: event.target.value,
                                  },
                                }))
                              }
                              className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700">Endstand</label>
                        <div className="mt-1 flex items-end gap-2">
                          <div>
                            <label className="block text-xs text-zinc-600">{match.homeTeam}</label>
                            <input
                              type="number"
                              min={0}
                              value={score.homeScore}
                              onChange={(event) =>
                                setScores((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...score,
                                    homeScore: event.target.value,
                                  },
                                }))
                              }
                              className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                            />
                          </div>
                          <span className="pb-2 font-semibold">:</span>
                          <div>
                            <label className="block text-xs text-zinc-600">{match.awayTeam}</label>
                            <input
                              type="number"
                              min={0}
                              value={score.awayScore}
                              onChange={(event) =>
                                setScores((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...score,
                                    awayScore: event.target.value,
                                  },
                                }))
                              }
                              className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700">Kort gesamt</label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={score.totalCards}
                          placeholder="z. B. 4"
                          title="Summe Kort (einheitliche Zählung für den Kort-Markt)"
                          onChange={(event) =>
                            setScores((current) => ({
                              ...current,
                              [match.id]: {
                                ...score,
                                totalCards: event.target.value,
                              },
                            }))
                          }
                          className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700">Hjornespark gesamt</label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={score.totalCorners}
                          placeholder="z. B. 9"
                          title="Summe Hjornespark (einheitliche Zählung für den Hjornespark-Markt)"
                          onChange={(event) =>
                            setScores((current) => ({
                              ...current,
                              [match.id]: {
                                ...score,
                                totalCorners: event.target.value,
                              },
                            }))
                          }
                          className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1"
                        />
                      </div>
                    </div>

                    {match.isKnockout && match.usesQualifyMethodMatrix ? (
                      <div className="w-full max-w-xl rounded-md border border-violet-200 bg-violet-50/80 p-3 text-sm">
                        <p className="font-semibold text-violet-950">Methode des Sieges (K.-o.)</p>
                        <p className="mt-1 text-xs text-violet-900">
                          Wähle, wie die Partie entschieden wurde. Die vier Tipps „Verlängerung / Elfmeter“ gewinnen nur,
                          wenn die Entscheidung dort fiel; bei Sieg in der regulären Zeit werden diese Tipps nicht
                          gewertet (void).
                        </p>
                        <label className="mt-2 block text-xs font-semibold text-violet-950">Entscheidung</label>
                        <select
                          value={score.knockoutDecidedBy}
                          onChange={(event) =>
                            setScores((current) => ({
                              ...current,
                              [match.id]: {
                                ...score,
                                knockoutDecidedBy: event.target.value as ScoreFormState["knockoutDecidedBy"],
                                knockoutAdvancingIsHome:
                                  event.target.value === "PENALTIES" ? score.knockoutAdvancingIsHome : "",
                              },
                            }))
                          }
                          className="mt-1 w-full max-w-sm rounded-md border border-violet-300 bg-white px-2 py-1.5 text-zinc-900"
                        >
                          <option value="">Bitte wählen …</option>
                          <option value="REGULATION">Reguläre Spielzeit</option>
                          <option value="EXTRA_TIME">Verlängerung</option>
                          <option value="PENALTIES">Elfmeterschießen</option>
                        </select>
                        {score.knockoutDecidedBy === "PENALTIES" ? (
                          <fieldset className="mt-3">
                            <legend className="text-xs font-semibold text-violet-950">
                              Nach Elfmeterschießen weiter
                            </legend>
                            <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-900">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`ko-adv-${match.id}`}
                                  checked={score.knockoutAdvancingIsHome === "home"}
                                  onChange={() =>
                                    setScores((current) => ({
                                      ...current,
                                      [match.id]: { ...score, knockoutAdvancingIsHome: "home" },
                                    }))
                                  }
                                />
                                {match.homeTeam}
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`ko-adv-${match.id}`}
                                  checked={score.knockoutAdvancingIsHome === "away"}
                                  onChange={() =>
                                    setScores((current) => ({
                                      ...current,
                                      [match.id]: { ...score, knockoutAdvancingIsHome: "away" },
                                    }))
                                  }
                                />
                                {match.awayTeam}
                              </label>
                            </div>
                          </fieldset>
                        ) : null}
                      </div>
                    ) : null}

                    <div>
                      <button
                        type="button"
                        disabled={savingId === match.id}
                        onClick={() => settle(match)}
                        className="cursor-pointer rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === match.id ? "Wertet aus..." : "Ergebnis bestätigen"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
