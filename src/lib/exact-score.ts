/**
 * Letzte Exact-Score-Option: Label „X:X“ = exakt 3:3 sowie jedes Ergebnis außerhalb der 0:0–3:3-Matrix
 * (nicht die 15 übrigen Einzelergebnisse).
 */
export const EXACT_SCORE_CATCH_ALL_LABEL = "X:X";

export function winningExactScoreOutcomes(homeScore: number, awayScore: number): string[] {
  if (homeScore <= 3 && awayScore <= 3) {
    if (homeScore === 3 && awayScore === 3) {
      return [EXACT_SCORE_CATCH_ALL_LABEL];
    }
    return [`${homeScore}:${awayScore}`];
  }
  return [EXACT_SCORE_CATCH_ALL_LABEL];
}

/** Für Einfach-Tipp: welche Markt-Outcome-Zeile passt zur Vorhersage? */
export function exactScoreOutcomeForPrediction(predictedHome: number, predictedAway: number): string {
  return winningExactScoreOutcomes(predictedHome, predictedAway)[0];
}
