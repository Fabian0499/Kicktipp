import type { MarketType } from "@prisma/client";

/**
 * Logische Wett-Kategorie für die Profi-Regel „max. ein offener Tipp pro Kategorie pro Spiel“.
 * Alle Tor-Linien zählen als **eine** Kategorie.
 */
export function profiMarketCategoryKey(marketType: MarketType | string): string {
  const t = String(marketType);
  if (t.startsWith("OVER_UNDER_") || t === "GOALS_MATRIX") {
    return "GOALS_OVER_UNDER";
  }
  return t;
}
