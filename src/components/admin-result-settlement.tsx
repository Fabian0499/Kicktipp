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
  homeScoreAfterExtraTime: number | null;
  awayScoreAfterExtraTime: number | null;
  knockoutDecidedBy: "" | "REGULATION" | "EXTRA_TIME" | "PENALTIES";
  knockoutAdvancingIsHome: boolean | null;
  settledAt: string | null;
  totalCards: number | null;
  totalCorners: number | null;
};

type ScoreFormState = {
  homeHalfTimeScore: string;
  awayHalfTimeScore: string;
  homeScore: string;
  awayScore: string;
  homeScoreAfterExtraTime: string;
  awayScoreAfterExtraTime: string;
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
  homeScoreAfterExtraTime: "",
  awayScoreAfterExtraTime: "",
  totalCards: "",
  totalCorners: "",
  knockoutDecidedBy: "",
  knockoutAdvancingIsHome: "",
});

function scoreFromMatch(match: MatchItem): ScoreFormState {
  return {
    homeHalfTimeScore: match.homeHalfTimeScore != null ? String(match.homeHalfTimeScore) : "",
    awayHalfTimeScore: match.awayHalfTimeScore != null ? String(match.awayHalfTimeScore) : "",
    homeScore: match.homeScore != null ? String(match.homeScore) : "",
    awayScore: match.awayScore != null ? String(match.awayScore) : "",
    homeScoreAfterExtraTime:
      match.homeScoreAfterExtraTime != null ? String(match.homeScoreAfterExtraTime) : "",
    awayScoreAfterExtraTime:
      match.awayScoreAfterExtraTime != null ? String(match.awayScoreAfterExtraTime) : "",
    totalCards: match.totalCards != null ? String(match.totalCards) : "",
    totalCorners: match.totalCorners != null ? String(match.totalCorners) : "",
    knockoutDecidedBy: match.knockoutDecidedBy ?? "",
    knockoutAdvancingIsHome:
      match.knockoutAdvancingIsHome === true
        ? "home"
        : match.knockoutAdvancingIsHome === false
          ? "away"
          : "",
  };
}

function fullTimeScoreLabel(match: MatchItem): string {
  return match.isKnockout && match.usesQualifyMethodMatrix ? "Endstand nach 90 Min." : "Endstand";
}

export function AdminResultSettlement({ matches }: { matches: MatchItem[] }) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreFormState>>({});
  const [correctionOpen, setCorrectionOpen] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openMatches = matches.filter((match) => !match.settledAt);
  const settledMatches = matches.filter((match) => Boolean(match.settledAt));

  async function submitSettlement(match: MatchItem, method: "POST" | "PATCH") {
    const scoreEntry = scores[match.id] ?? emptyScore();
    const homeHalfTimeScore = Number(scoreEntry.homeHalfTimeScore);
    const awayHalfTimeScore = Number(scoreEntry.awayHalfTimeScore);
    const homeScore = Number(scoreEntry.homeScore);
    const awayScore = Number(scoreEntry.awayScore);
    const homeScoreAfterExtraTime =
      scoreEntry.homeScoreAfterExtraTime.trim() === ""
        ? undefined
        : Number(scoreEntry.homeScoreAfterExtraTime);
    const awayScoreAfterExtraTime =
      scoreEntry.awayScoreAfterExtraTime.trim() === ""
        ? undefined
        : Number(scoreEntry.awayScoreAfterExtraTime);
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
      if (scoreEntry.knockoutDecidedBy === "EXTRA_TIME") {
        if (
          homeScoreAfterExtraTime === undefined ||
          awayScoreAfterExtraTime === undefined ||
          !Number.isInteger(homeScoreAfterExtraTime) ||
          !Number.isInteger(awayScoreAfterExtraTime) ||
          homeScoreAfterExtraTime < 0 ||
          awayScoreAfterExtraTime < 0
        ) {
          setError("Bitte den Endstand nach Verlängerung eingeben.");
          setMessage("");
          return;
        }
        if (homeScoreAfterExtraTime === awayScoreAfterExtraTime) {
          setError("Nach Verlängerung muss ein Sieger feststehen.");
          setMessage("");
          return;
        }
        if (homeScore !== awayScore) {
          setError("Bei Sieg nach 90 Minuten wähle „Reguläre Spielzeit“, nicht Verlängerung.");
          setMessage("");
          return;
        }
      }
      if (scoreEntry.knockoutDecidedBy === "PENALTIES") {
        if (homeScore !== awayScore) {
          setError("Elfmeterschießen ist nur bei Unentschieden nach 90 Minuten wählbar.");
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
      if (scoreEntry.knockoutDecidedBy === "EXTRA_TIME") {
        payload.homeScoreAfterExtraTime = homeScoreAfterExtraTime;
        payload.awayScoreAfterExtraTime = awayScoreAfterExtraTime;
      }
      if (scoreEntry.knockoutDecidedBy === "PENALTIES" && homeScore === awayScore) {
        payload.knockoutAdvancingIsHome = scoreEntry.knockoutAdvancingIsHome === "home";
      }
    }

    const response = await fetch(`/api/admin/matches/${match.id}/result`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? (method === "PATCH" ? "Korrektur fehlgeschlagen." : "Auswertung fehlgeschlagen."));
      setSavingId(null);
      return;
    }

    const body = (await response.json()) as {
      settledCount: number;
      reversedWinnings?: number;
      reversedBets?: number;
    };
    if (method === "PATCH") {
      setMessage(
        `Korrektur abgeschlossen. ${body.reversedBets ?? 0} Tipps neu ausgewertet, ${body.reversedWinnings ?? 0} Gewinn-Punkte zurückgebucht, ${body.settledCount} Tipps verarbeitet.`,
      );
    } else {
      setMessage(`Auswertung abgeschlossen. Verarbeitete Tipps: ${body.settledCount}`);
    }
    setSavingId(null);
    window.location.reload();
  }

  function openCorrectionForm(match: MatchItem) {
    setScores((current) => ({ ...current, [match.id]: scoreFromMatch(match) }));
    setCorrectionOpen((current) => ({ ...current, [match.id]: true }));
    setError("");
    setMessage("");
  }

  return (
    <section className="mt-8 rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
      <h2 className="text-xl font-semibold">Ergebnisse eintragen & auswerten</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Ergebnis eintragen oder bei Bedarf eine bestehende Auswertung korrigieren. Gewinne werden automatisch den
        Wallets gutgeschrieben bzw. zurückgebucht.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

      <h3 className="mt-6 text-lg font-semibold">Neue Auswertungen</h3>
      <div className="mt-3 space-y-3">
        {openMatches.length === 0 ? (
          <p className="text-sm text-zinc-600">Keine offenen Spiele zur Auswertung.</p>
        ) : (
          openMatches.map((match) => {
            const score = scores[match.id] ?? emptyScore();

            return (
              <article key={match.id} className="rounded-md border p-4">
                <p className="font-semibold">
                  {match.homeTeam} vs. {match.awayTeam}
                </p>
                <p className="text-sm text-zinc-600">Anstoß: {new Date(match.startsAt).toLocaleString("de-DE")}</p>
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
                        <label className="block text-xs font-semibold text-zinc-700">{fullTimeScoreLabel(match)}</label>
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
                          Das Ergebnis nach 90 Minuten gilt für alle Standard-Tipps (1X2, Tore, …). Bei
                          Verlängerung oder Elfmeterschießen zusätzlich die Entscheidung angeben. Die vier Tipps
                          „Verlängerung / Elfmeter“ gewinnen nur, wenn die Entscheidung dort fiel.
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
                                homeScoreAfterExtraTime:
                                  event.target.value === "EXTRA_TIME" ? score.homeScoreAfterExtraTime : "",
                                awayScoreAfterExtraTime:
                                  event.target.value === "EXTRA_TIME" ? score.awayScoreAfterExtraTime : "",
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
                        {score.knockoutDecidedBy === "EXTRA_TIME" ? (
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-violet-950">
                              Endstand nach Verlängerung
                            </label>
                            <div className="mt-1 flex items-end gap-2">
                              <div>
                                <label className="block text-xs text-violet-900">{match.homeTeam}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={score.homeScoreAfterExtraTime}
                                  onChange={(event) =>
                                    setScores((current) => ({
                                      ...current,
                                      [match.id]: {
                                        ...score,
                                        homeScoreAfterExtraTime: event.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-md border border-violet-300 bg-white px-2 py-1"
                                />
                              </div>
                              <span className="pb-2 font-semibold">:</span>
                              <div>
                                <label className="block text-xs text-violet-900">{match.awayTeam}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={score.awayScoreAfterExtraTime}
                                  onChange={(event) =>
                                    setScores((current) => ({
                                      ...current,
                                      [match.id]: {
                                        ...score,
                                        awayScoreAfterExtraTime: event.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-md border border-violet-300 bg-white px-2 py-1"
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}
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
                        onClick={() => submitSettlement(match, "POST")}
                        className="cursor-pointer rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === match.id ? "Wertet aus..." : "Ergebnis bestätigen"}
                      </button>
                    </div>
                  </div>
              </article>
            );
          })
        )}
      </div>

      <h3 className="mt-8 text-lg font-semibold">Auswertung korrigieren</h3>
      <p className="mt-1 text-sm text-zinc-600">
        Bereits ausgewertete Spiele: alte Gewinne werden zurückgebucht, alle Tipps neu gewertet. Bei K.-o.-Spielen mit
        „Methode des Sieges“ die Entscheidung erneut angeben.
      </p>
      <div className="mt-3 space-y-3">
        {settledMatches.length === 0 ? (
          <p className="text-sm text-zinc-600">Noch keine ausgewerteten Spiele.</p>
        ) : (
          settledMatches.map((match) => {
            const score = scores[match.id] ?? emptyScore();
            const showForm = correctionOpen[match.id];

            return (
              <article key={`correct-${match.id}`} className="rounded-md border border-amber-200 bg-amber-50/40 p-4">
                <p className="font-semibold">
                  {match.homeTeam} vs. {match.awayTeam}
                </p>
                <p className="text-sm text-zinc-600">Anstoß: {new Date(match.startsAt).toLocaleString("de-DE")}</p>
                <p className="mt-2 text-sm font-medium text-emerald-800">
                  Aktuell – Halbzeit: {match.homeHalfTimeScore} : {match.awayHalfTimeScore}, Endstand
                  {match.isKnockout && match.usesQualifyMethodMatrix ? " (90 Min.)" : ""}: {match.homeScore} :{" "}
                  {match.awayScore}
                  {match.homeScoreAfterExtraTime != null && match.awayScoreAfterExtraTime != null
                    ? `, nach Verlängerung: ${match.homeScoreAfterExtraTime} : ${match.awayScoreAfterExtraTime}`
                    : null}
                  {match.knockoutDecidedBy
                    ? `, Entscheidung: ${
                        match.knockoutDecidedBy === "REGULATION"
                          ? "Reguläre Zeit"
                          : match.knockoutDecidedBy === "EXTRA_TIME"
                            ? "Verlängerung"
                            : "Elfmeter"
                      }`
                    : null}
                  {match.totalCards != null ? `, Kort: ${match.totalCards}` : null}
                  {match.totalCorners != null ? `, Hjornespark: ${match.totalCorners}` : null}
                </p>
                {!showForm ? (
                  <button
                    type="button"
                    onClick={() => openCorrectionForm(match)}
                    className="mt-3 cursor-pointer rounded-md border border-amber-800 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-50"
                  >
                    Ergebnis ändern
                  </button>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="text-xs text-amber-950">Neues Ergebnis eingeben:</p>
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700">Halbzeit</label>
                        <div className="mt-1 flex items-end gap-2">
                          <input
                            type="number"
                            min={0}
                            value={score.homeHalfTimeScore}
                            onChange={(e) =>
                              setScores((c) => ({
                                ...c,
                                [match.id]: { ...score, homeHalfTimeScore: e.target.value },
                              }))
                            }
                            className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                          />
                          <span className="pb-2 font-semibold">:</span>
                          <input
                            type="number"
                            min={0}
                            value={score.awayHalfTimeScore}
                            onChange={(e) =>
                              setScores((c) => ({
                                ...c,
                                [match.id]: { ...score, awayHalfTimeScore: e.target.value },
                              }))
                            }
                            className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700">{fullTimeScoreLabel(match)}</label>
                        <div className="mt-1 flex items-end gap-2">
                          <input
                            type="number"
                            min={0}
                            value={score.homeScore}
                            onChange={(e) =>
                              setScores((c) => ({ ...c, [match.id]: { ...score, homeScore: e.target.value } }))
                            }
                            className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                          />
                          <span className="pb-2 font-semibold">:</span>
                          <input
                            type="number"
                            min={0}
                            value={score.awayScore}
                            onChange={(e) =>
                              setScores((c) => ({ ...c, [match.id]: { ...score, awayScore: e.target.value } }))
                            }
                            className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700">Kort gesamt</label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={score.totalCards}
                          onChange={(e) =>
                            setScores((c) => ({ ...c, [match.id]: { ...score, totalCards: e.target.value } }))
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
                          onChange={(e) =>
                            setScores((c) => ({ ...c, [match.id]: { ...score, totalCorners: e.target.value } }))
                          }
                          className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1"
                        />
                      </div>
                    </div>
                    {match.isKnockout && match.usesQualifyMethodMatrix ? (
                      <div className="w-full max-w-xl rounded-md border border-violet-200 bg-violet-50/80 p-3 text-sm">
                        <p className="font-semibold text-violet-950">Methode des Sieges (K.-o.)</p>
                        <select
                          value={score.knockoutDecidedBy}
                          onChange={(e) =>
                            setScores((c) => ({
                              ...c,
                              [match.id]: {
                                ...score,
                                knockoutDecidedBy: e.target.value as ScoreFormState["knockoutDecidedBy"],
                                knockoutAdvancingIsHome:
                                  e.target.value === "PENALTIES" ? score.knockoutAdvancingIsHome : "",
                                homeScoreAfterExtraTime:
                                  e.target.value === "EXTRA_TIME" ? score.homeScoreAfterExtraTime : "",
                                awayScoreAfterExtraTime:
                                  e.target.value === "EXTRA_TIME" ? score.awayScoreAfterExtraTime : "",
                              },
                            }))
                          }
                          className="mt-2 w-full max-w-sm rounded-md border border-violet-300 bg-white px-2 py-1.5"
                        >
                          <option value="">Bitte wählen …</option>
                          <option value="REGULATION">Reguläre Spielzeit</option>
                          <option value="EXTRA_TIME">Verlängerung</option>
                          <option value="PENALTIES">Elfmeterschießen</option>
                        </select>
                        {score.knockoutDecidedBy === "EXTRA_TIME" ? (
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-violet-950">
                              Endstand nach Verlängerung
                            </label>
                            <div className="mt-1 flex items-end gap-2">
                              <div>
                                <label className="block text-xs text-violet-900">{match.homeTeam}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={score.homeScoreAfterExtraTime}
                                  onChange={(event) =>
                                    setScores((current) => ({
                                      ...current,
                                      [match.id]: {
                                        ...score,
                                        homeScoreAfterExtraTime: event.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-md border border-violet-300 bg-white px-2 py-1"
                                />
                              </div>
                              <span className="pb-2 font-semibold">:</span>
                              <div>
                                <label className="block text-xs text-violet-900">{match.awayTeam}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={score.awayScoreAfterExtraTime}
                                  onChange={(event) =>
                                    setScores((current) => ({
                                      ...current,
                                      [match.id]: {
                                        ...score,
                                        awayScoreAfterExtraTime: event.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-md border border-violet-300 bg-white px-2 py-1"
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {score.knockoutDecidedBy === "PENALTIES" ? (
                          <fieldset className="mt-3">
                            <legend className="text-xs font-semibold text-violet-950">Nach Elfmeter weiter</legend>
                            <div className="mt-1 flex flex-wrap gap-3 text-sm">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`ko-correct-${match.id}`}
                                  checked={score.knockoutAdvancingIsHome === "home"}
                                  onChange={() =>
                                    setScores((c) => ({
                                      ...c,
                                      [match.id]: { ...score, knockoutAdvancingIsHome: "home" },
                                    }))
                                  }
                                />
                                {match.homeTeam}
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`ko-correct-${match.id}`}
                                  checked={score.knockoutAdvancingIsHome === "away"}
                                  onChange={() =>
                                    setScores((c) => ({
                                      ...c,
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingId === match.id}
                        onClick={() => submitSettlement(match, "PATCH")}
                        className="cursor-pointer rounded-md bg-amber-800 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === match.id ? "Korrigiert…" : "Korrektur speichern & neu auswerten"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCorrectionOpen((c) => ({ ...c, [match.id]: false }))}
                        className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
                      >
                        Abbrechen
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
