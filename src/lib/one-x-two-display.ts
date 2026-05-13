/** Anzeige für Profi-UI: 1X2-Optionen als Mannschaftsnamen / „Unentschieden“ (intern weiter 1 / X / 2). */
export function formatOneXTwoDisplayLabel(outcome: string, homeTeam: string, awayTeam: string): string {
  const home = homeTeam.trim();
  const away = awayTeam.trim();
  if (outcome === "1") {
    return home || "1";
  }
  if (outcome === "X") {
    return "Unentschieden";
  }
  if (outcome === "2") {
    return away || "2";
  }
  return outcome;
}
