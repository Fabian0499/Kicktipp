"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminThresholdMatrixEditor,
  type EditableThresholdMatrix,
  serializeEditableMatrix,
} from "@/components/admin-threshold-matrix-editor";
import { formatCardsMatrixOutcomeLabel } from "@/lib/cards-market";
import { formatCornersMatrixOutcomeLabel } from "@/lib/corners-market";
import { formatGoalsMatrixOutcomeLabel } from "@/lib/goals-market";
import { formatHandicapMatrixOutcomeLabel } from "@/lib/handicap-market";
import { formatHalfTimeFullTimeDisplayLabel, formatOneXTwoDisplayLabel } from "@/lib/one-x-two-display";
import { parseThresholdMatrixRowsFromOptions } from "@/lib/threshold-matrix-options";
import { usePersistedDetailsOpen } from "@/hooks/use-persisted-details-open";

const STORAGE_KEY = "kicktipp-admin-match-odds-editor-open";
const MATRIX_MARKET_TYPES = new Set(["CARDS_MATRIX", "CORNERS_MATRIX"]);

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type OptionRow = {
  id: string;
  outcome: string;
  odds: number;
};

type MarketRow = {
  id: string;
  type: string;
  title: string;
  options: OptionRow[];
};

type MatchRow = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  settledAt: string | null;
  cardsMatrixStart: number;
  cardsMatrixRowCount: number;
  cornersMatrixStart: number;
  cornersMatrixRowCount: number;
  markets: MarketRow[];
};

function toEditableMatrix(
  prefix: "CARDS" | "CORNERS",
  market: MarketRow | undefined,
  matrixStart: number,
  matrixRowCount: number,
): EditableThresholdMatrix | null {
  if (!market) {
    return null;
  }

  const rows = parseThresholdMatrixRowsFromOptions(prefix, market.options, matrixStart, matrixRowCount);
  return {
    matrixStart,
    matrixRowCount,
    rows: rows.map((row) =>
      row.unter === undefined
        ? { exakt: String(row.exakt), uber: String(row.uber) }
        : { unter: String(row.unter), exakt: String(row.exakt), uber: String(row.uber) },
    ),
  };
}

function displayOutcomeLabel(marketType: string, outcome: string, homeTeam: string, awayTeam: string): string {
  if (marketType === "ONE_X_TWO") {
    return formatOneXTwoDisplayLabel(outcome, homeTeam, awayTeam);
  }
  if (marketType === "HALF_TIME_FULL_TIME") {
    return formatHalfTimeFullTimeDisplayLabel(outcome, homeTeam, awayTeam);
  }
  if (marketType === "HANDICAP_MATRIX") {
    return formatHandicapMatrixOutcomeLabel(outcome, homeTeam, awayTeam);
  }
  if (marketType === "CARDS_MATRIX") {
    return formatCardsMatrixOutcomeLabel(outcome);
  }
  if (marketType === "CORNERS_MATRIX") {
    return formatCornersMatrixOutcomeLabel(outcome);
  }
  if (marketType === "GOALS_MATRIX") {
    return formatGoalsMatrixOutcomeLabel(outcome);
  }
  if (marketType === "TO_QUALIFY") {
    if (outcome === "1") return `${homeTeam} (1)`;
    if (outcome === "2") return `${awayTeam} (2)`;
    if (outcome === "QUALIFY:ET:1") return `Verlängerung – ${homeTeam}`;
    if (outcome === "QUALIFY:ET:2") return `Verlängerung – ${awayTeam}`;
    if (outcome === "QUALIFY:PEN:1") return `Elfmeter – ${homeTeam}`;
    if (outcome === "QUALIFY:PEN:2") return `Elfmeter – ${awayTeam}`;
  }
  return outcome;
}

export function AdminMatchOddsEditor({ matches }: { matches: MatchRow[] }) {
  const router = useRouter();
  const { open, onToggle } = usePersistedDetailsOpen(STORAGE_KEY, false);
  const [oddsById, setOddsById] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      matches.flatMap((match) =>
        match.markets
          .filter((market) => !MATRIX_MARKET_TYPES.has(market.type))
          .flatMap((market) => market.options.map((option) => [option.id, String(option.odds)])),
      ),
    ),
  );
  const [startsAtByMatchId, setStartsAtByMatchId] = useState<Record<string, string>>(() =>
    Object.fromEntries(matches.map((match) => [match.id, toDatetimeLocalValue(match.startsAt)])),
  );
  const [cardsMatrixByMatchId, setCardsMatrixByMatchId] = useState<Record<string, EditableThresholdMatrix>>(() =>
    Object.fromEntries(
      matches
        .map((match) => {
          const market = match.markets.find((entry) => entry.type === "CARDS_MATRIX");
          const matrix = toEditableMatrix(
            "CARDS",
            market,
            match.cardsMatrixStart,
            match.cardsMatrixRowCount,
          );
          return matrix ? [match.id, matrix] : null;
        })
        .filter((entry): entry is [string, EditableThresholdMatrix] => entry !== null),
    ),
  );
  const [cornersMatrixByMatchId, setCornersMatrixByMatchId] = useState<Record<string, EditableThresholdMatrix>>(
    () =>
      Object.fromEntries(
        matches
          .map((match) => {
            const market = match.markets.find((entry) => entry.type === "CORNERS_MATRIX");
            const matrix = toEditableMatrix(
              "CORNERS",
              market,
              match.cornersMatrixStart,
              match.cornersMatrixRowCount,
            );
            return matrix ? [match.id, matrix] : null;
          })
          .filter((entry): entry is [string, EditableThresholdMatrix] => entry !== null),
      ),
  );
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [successMatchId, setSuccessMatchId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const matchOptionIds = useMemo(
    () =>
      new Map(
        matches.map((match) => [
          match.id,
          match.markets
            .filter((market) => !MATRIX_MARKET_TYPES.has(market.type))
            .flatMap((market) => market.options.map((option) => option.id)),
        ]),
      ),
    [matches],
  );

  async function saveMatchOdds(event: FormEvent<HTMLFormElement>, match: MatchRow) {
    event.preventDefault();
    setSavingMatchId(match.id);
    setSuccessMatchId(null);
    setError("");

    const optionIds = matchOptionIds.get(match.id) ?? [];
    const startsAtLocal = startsAtByMatchId[match.id];
    if (!startsAtLocal) {
      setError("Bitte ein gültiges Anstoßdatum angeben.");
      setSavingMatchId(null);
      return;
    }

    const cardsMatrix = cardsMatrixByMatchId[match.id];
    const cornersMatrix = cornersMatrixByMatchId[match.id];

    const response = await fetch(`/api/admin/matches/${match.id}/odds`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: new Date(startsAtLocal).toISOString(),
        options: optionIds.map((id) => ({
          id,
          odds: Number(oddsById[id]),
        })),
        ...(cardsMatrix ? { cardsMatrix: serializeEditableMatrix(cardsMatrix) } : {}),
        ...(cornersMatrix ? { cornersMatrix: serializeEditableMatrix(cornersMatrix) } : {}),
      }),
    });

    setSavingMatchId(null);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Änderungen konnten nicht gespeichert werden.");
      return;
    }

    setSuccessMatchId(match.id);
    router.refresh();
  }

  return (
    <details
      className="mt-8 max-w-full min-w-0 overflow-hidden rounded-xl border bg-white p-4 text-zinc-900 shadow-sm sm:p-5"
      open={open}
      onToggle={onToggle}
    >
      <summary className="cursor-pointer text-xl font-semibold text-zinc-900">Bestehende Spiele bearbeiten</summary>
      <p className="mt-2 text-sm text-zinc-600">
        Anstoßzeit, Quoten und bei Kort/Hjornespark auch die Zeilenanzahl anpassbar. Quotenänderungen gelten nur für
        neue Tipps; bestehende Wetten behalten ihre gespeicherte Quote. Zeilen mit Tipps können nicht entfernt werden.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-5 space-y-4">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-600">Keine Spiele vorhanden.</p>
        ) : (
          matches.map((match) => {
            const settled = Boolean(match.settledAt);
            const cardsMatrix = cardsMatrixByMatchId[match.id];
            const cornersMatrix = cornersMatrixByMatchId[match.id];

            return (
              <details key={match.id} className="min-w-0 max-w-full rounded-lg border border-zinc-200 p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-zinc-900">
                        {match.homeTeam} vs. {match.awayTeam}
                      </h3>
                      <p className="text-sm text-zinc-600">
                        Anstoß: {new Date(startsAtByMatchId[match.id] ?? match.startsAt).toLocaleString("de-DE")}
                      </p>
                      {settled ? (
                        <p className="text-xs font-medium text-amber-700">Bereits ausgewertet – Quoten gesperrt.</p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium text-zinc-600">Quoten anzeigen</span>
                  </div>
                </summary>

                <form className="mt-4 min-w-0 max-w-full" onSubmit={(event) => saveMatchOdds(event, match)}>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <label className="block min-w-[min(100%,16rem)]">
                      <span className="text-sm font-medium text-zinc-900">Anstoß (Datum & Uhrzeit)</span>
                      <input
                        type="datetime-local"
                        required
                        disabled={settled}
                        value={startsAtByMatchId[match.id] ?? ""}
                        onChange={(event) =>
                          setStartsAtByMatchId((current) => ({
                            ...current,
                            [match.id]: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={settled || savingMatchId === match.id}
                      className="cursor-pointer rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingMatchId === match.id ? "Speichert..." : "Speichern"}
                    </button>
                  </div>
                  {successMatchId === match.id ? (
                    <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Änderungen wurden gespeichert.
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-4">
                    {cardsMatrix ? (
                      <AdminThresholdMatrixEditor
                        title="Kort"
                        description="Gesamtzahl Kort. Zeilenanzahl und erste Schwelle N wie beim Anlegen eines Spiels."
                        matrix={cardsMatrix}
                        disabled={settled}
                        onChange={(nextMatrix) =>
                          setCardsMatrixByMatchId((current) => ({
                            ...current,
                            [match.id]: nextMatrix,
                          }))
                        }
                      />
                    ) : null}

                    {cornersMatrix ? (
                      <AdminThresholdMatrixEditor
                        title="Hjornespark"
                        description="Gesamtzahl Hjornespark. Zeilenanzahl und erste Schwelle N wie beim Anlegen eines Spiels."
                        matrix={cornersMatrix}
                        disabled={settled}
                        onChange={(nextMatrix) =>
                          setCornersMatrixByMatchId((current) => ({
                            ...current,
                            [match.id]: nextMatrix,
                          }))
                        }
                      />
                    ) : null}

                    {match.markets
                      .filter((market) => !MATRIX_MARKET_TYPES.has(market.type))
                      .map((market) => (
                        <section
                          key={market.id}
                          className="min-w-0 max-w-full rounded-md border border-zinc-100 bg-zinc-50 p-3"
                        >
                          <h4 className="font-medium text-zinc-900">{market.title}</h4>
                          <div className="mt-2 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 lg:grid-cols-3">
                            {market.options.map((option) => (
                              <label
                                key={option.id}
                                className="block min-w-0 max-w-full rounded-md border border-zinc-200 bg-white p-2"
                              >
                                <span className="block text-xs font-medium text-zinc-700">
                                  {displayOutcomeLabel(
                                    market.type,
                                    option.outcome,
                                    match.homeTeam,
                                    match.awayTeam,
                                  )}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="1.01"
                                  max={1000}
                                  disabled={settled}
                                  value={oddsById[option.id] ?? ""}
                                  onChange={(event) =>
                                    setOddsById((current) => ({
                                      ...current,
                                      [option.id]: event.target.value,
                                    }))
                                  }
                                  className="mt-1 w-full min-w-0 max-w-full rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-100"
                                />
                              </label>
                            ))}
                          </div>
                        </section>
                      ))}
                  </div>
                </form>
              </details>
            );
          })
        )}
      </div>
    </details>
  );
}
