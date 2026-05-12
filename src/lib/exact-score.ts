/** Maximales Tor-Raster für Einzelquoten (0:0 … 4:4). */
export const EXACT_SCORE_MATRIX_MAX = 4;

/**
 * Option „X:X“ = Sammelquote für jedes Ergebnis, bei dem mindestens eine Mannschaft mehr als
 * {@link EXACT_SCORE_MATRIX_MAX} Tore erzielt hat (also außerhalb der 5×5-Matrix).
 */
export const EXACT_SCORE_CATCH_ALL_LABEL = "X:X";

export function winningExactScoreOutcomes(homeScore: number, awayScore: number): string[] {
  if (homeScore <= EXACT_SCORE_MATRIX_MAX && awayScore <= EXACT_SCORE_MATRIX_MAX) {
    return [`${homeScore}:${awayScore}`];
  }
  return [EXACT_SCORE_CATCH_ALL_LABEL];
}

/** Für Einfach-Tipp: welche Markt-Outcome-Zeile passt zur Vorhersage? */
export function exactScoreOutcomeForPrediction(predictedHome: number, predictedAway: number): string {
  return winningExactScoreOutcomes(predictedHome, predictedAway)[0];
}
