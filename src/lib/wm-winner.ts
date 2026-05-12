export const WM_WINNER_EVENT_KEY = "WM_2026";
/** Nominaler Einsatz pro Person; wird nicht vom Wallet abgebucht, solange der erste WM-Tipp möglich ist. */
export const WM_WINNER_STAKE = 100;
export const WM_WINNER_MIN_ODDS = 1.2;
/** Gewinn-Obergrenze pro WM-Sieger-Tipp (Auszahlung ins Punktekonto) */
export const WM_WINNER_MAX_PAYOUT = 2000;

/** DB-Label der Restfeld-Option; in der Oberfläche als „Piraten“ angezeigt. */
export const WM_WINNER_FIELD_DB_LABEL = "Alle anderen Mannschaften";

/**
 * ISO 3166-1 alpha-2 für Flaggen-Grafiken (flagcdn). Unter Windows werden Emoji-Flaggen oft nur als
 * Buchstabenpaar gerendert – daher PNG im UI. England → „gb“ (Union Jack).
 */
export const WM_WINNER_FLAG_ISO: Record<string, string> = {
  Spanien: "es",
  Frankreich: "fr",
  England: "gb",
  Brasilien: "br",
  Argentinien: "ar",
  Portugal: "pt",
  Deutschland: "de",
};

export function wmWinnerDisplayLabel(option: { label: string; isField: boolean }): string {
  if (option.isField) {
    return "Piraten";
  }
  return option.label;
}

export function wmWinnerDisplayFromStoredLabel(label: string): string {
  if (label === WM_WINNER_FIELD_DB_LABEL) {
    return "Piraten";
  }
  return label;
}
