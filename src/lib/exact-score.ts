/**
 * Heimsiege (Heim : Gast) in Anzeige-Reihenfolge.
 */
export const EXACT_SCORE_HOME_WINS = [
  "1:0",
  "2:0",
  "2:1",
  "3:0",
  "3:1",
  "3:2",
  "4:0",
  "4:1",
  "4:2",
  "4:3",
  "5:0",
  "5:1",
  "5:2",
  "6:0",
  "6:1",
] as const;

/** Unentschieden */
export const EXACT_SCORE_DRAWS = ["0:0", "1:1", "2:2", "3:3", "4:4"] as const;

/**
 * Auswärtssiege (Heim : Gast) — Spiegelung der Heim-Spalte.
 */
export const EXACT_SCORE_AWAY_WINS = [
  "0:1",
  "0:2",
  "1:2",
  "0:3",
  "1:3",
  "2:3",
  "0:4",
  "1:4",
  "2:4",
  "3:4",
  "0:5",
  "1:5",
  "2:5",
  "0:6",
  "1:6",
] as const;

/** Alle Einzel-Ergebniszeilen in UI-Reihenfolge (ohne Sammelquote). */
export const EXACT_SCORE_ORDERED_OUTCOMES = [
  ...EXACT_SCORE_HOME_WINS,
  ...EXACT_SCORE_DRAWS,
  ...EXACT_SCORE_AWAY_WINS,
] as const;

const EXACT_SCORE_EXPLICIT = new Set<string>(EXACT_SCORE_ORDERED_OUTCOMES);

/** Frühere Sammelquote „X:X“ (nur noch für Sortierung / alte Marktdaten). */
export const EXACT_SCORE_CATCH_ALL_LABEL = "X:X";

export function winningExactScoreOutcomes(homeScore: number, awayScore: number): string[] {
  const label = `${homeScore}:${awayScore}`;
  if (EXACT_SCORE_EXPLICIT.has(label)) {
    return [label];
  }
  return [];
}

/** Für Einfach-Tipp: Outcome-Label = erwarteter Endstand (muss als Marktoption existieren). */
export function exactScoreOutcomeForPrediction(predictedHome: number, predictedAway: number): string {
  return `${predictedHome}:${predictedAway}`;
}

/** Sortier-Index für Marktoptionen (kleiner = weiter oben in der Gesamtliste). */
export function exactScoreOutcomeSortIndex(outcome: string): number {
  if (outcome === EXACT_SCORE_CATCH_ALL_LABEL) {
    return EXACT_SCORE_ORDERED_OUTCOMES.length + 1;
  }
  const idx = EXACT_SCORE_ORDERED_OUTCOMES.indexOf(outcome as (typeof EXACT_SCORE_ORDERED_OUTCOMES)[number]);
  return idx === -1 ? EXACT_SCORE_ORDERED_OUTCOMES.length : idx;
}

/** Sortierung für ältere Spiele mit abweichenden Ergebniszeilen oder gemischte Listen. */
export function sortExactScoreMarketOptions<T extends { outcome: string }>(options: T[]): T[] {
  return [...options].sort((a, b) => {
    const ia = exactScoreOutcomeSortIndex(a.outcome);
    const ib = exactScoreOutcomeSortIndex(b.outcome);
    if (ia !== ib) {
      return ia - ib;
    }
    return a.outcome.localeCompare(b.outcome);
  });
}
