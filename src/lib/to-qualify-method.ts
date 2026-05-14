/** KO-Markt „Methode des Sieges“: Zeilen Verlängerung / Elfmeter, Spalten Heim / Gast */

export const QUALIFY_OUTCOME_ET_HOME = "QUALIFY:ET:1";
export const QUALIFY_OUTCOME_ET_AWAY = "QUALIFY:ET:2";
export const QUALIFY_OUTCOME_PEN_HOME = "QUALIFY:PEN:1";
export const QUALIFY_OUTCOME_PEN_AWAY = "QUALIFY:PEN:2";

export const QUALIFY_METHOD_OUTCOME_ORDER = [
  QUALIFY_OUTCOME_ET_HOME,
  QUALIFY_OUTCOME_ET_AWAY,
  QUALIFY_OUTCOME_PEN_HOME,
  QUALIFY_OUTCOME_PEN_AWAY,
] as const;

export type KnockoutDecidedBy = "REGULATION" | "EXTRA_TIME" | "PENALTIES";

export function isQualifyMethodOutcome(outcome: string): boolean {
  return (
    outcome === QUALIFY_OUTCOME_ET_HOME ||
    outcome === QUALIFY_OUTCOME_ET_AWAY ||
    outcome === QUALIFY_OUTCOME_PEN_HOME ||
    outcome === QUALIFY_OUTCOME_PEN_AWAY
  );
}

export function qualifyMarketUsesMethodMatrix(options: { outcome: string }[]): boolean {
  return options.some((o) => isQualifyMethodOutcome(o.outcome));
}

/**
 * Gewinner-Outcomes für den 4-Felder-Markt (nur eine Zeile kann zutreffen).
 * REGULATION: keine der vier Auswahlen gewinnt → leeres Array (Tipps werden void).
 */
export function winningQualifyMethodOutcomes(
  decidedBy: KnockoutDecidedBy,
  homeScore: number,
  awayScore: number,
  advancingIsHomeWhenTied: boolean | undefined,
): string[] {
  if (decidedBy === "REGULATION") {
    return [];
  }

  const fromScore =
    homeScore > awayScore ? true : homeScore < awayScore ? false : undefined;

  if (decidedBy === "EXTRA_TIME") {
    if (fromScore === undefined) {
      return [];
    }
    return fromScore ? [QUALIFY_OUTCOME_ET_HOME] : [QUALIFY_OUTCOME_ET_AWAY];
  }

  const homeWins =
    fromScore !== undefined ? fromScore : Boolean(advancingIsHomeWhenTied);
  return homeWins ? [QUALIFY_OUTCOME_PEN_HOME] : [QUALIFY_OUTCOME_PEN_AWAY];
}

export function formatToQualifyOutcomeDisplay(
  outcome: string,
  homeTeam: string,
  awayTeam: string,
): string {
  if (outcome === "1") {
    return `${homeTeam} qualifiziert sich`;
  }
  if (outcome === "2") {
    return `${awayTeam} qualifiziert sich`;
  }
  if (outcome === QUALIFY_OUTCOME_ET_HOME) {
    return `In Verlängerung – ${homeTeam}`;
  }
  if (outcome === QUALIFY_OUTCOME_ET_AWAY) {
    return `In Verlängerung – ${awayTeam}`;
  }
  if (outcome === QUALIFY_OUTCOME_PEN_HOME) {
    return `Nach Elfmeterschießen – ${homeTeam}`;
  }
  if (outcome === QUALIFY_OUTCOME_PEN_AWAY) {
    return `Nach Elfmeterschießen – ${awayTeam}`;
  }
  return outcome;
}
