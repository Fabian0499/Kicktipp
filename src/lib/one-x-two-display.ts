/** Anzeige für Profi-UI: 1X2-Optionen als Mannschaftsnamen / „Unentschieden“ (intern weiter 1 / X / 2). */
export function formatOneXTwoDisplayLabel(
  outcome: string,
  homeTeam: string,
  awayTeam: string,
  drawLabel = "Unentschieden",
): string {
  const home = homeTeam.trim();
  const away = awayTeam.trim();
  if (outcome === "1") {
    return home || "1";
  }
  if (outcome === "X") {
    return drawLabel;
  }
  if (outcome === "2") {
    return away || "2";
  }
  return outcome;
}

/** Halbzeit/Endstand: „1/X“ → „Heim / Unentschieden“, „2/2“ → „Auswärts / Auswärts“ (intern unverändert 1/X/2). */
export function formatHalfTimeFullTimeDisplayLabel(
  outcome: string,
  homeTeam: string,
  awayTeam: string,
  drawLabel = "Unentschieden",
): string {
  const home = homeTeam.trim();
  const away = awayTeam.trim();
  const segments = outcome.trim().split("/");
  if (segments.length !== 2) {
    return outcome;
  }
  const ht = segments[0].trim().toUpperCase();
  const ft = segments[1].trim().toUpperCase();
  const mapSymbol = (symbol: string): string => {
    if (symbol === "1") {
      return home || "1";
    }
    if (symbol === "X") {
      return drawLabel;
    }
    if (symbol === "2") {
      return away || "2";
    }
    return symbol;
  };
  if (!/^[12X]$/.test(ht) || !/^[12X]$/.test(ft)) {
    return outcome;
  }
  return `${mapSymbol(ht)} / ${mapSymbol(ft)}`;
}
