import type { MarketType } from "@prisma/client";

/**
 * Logische Wett-Kategorie für die Profi-Regel „max. ein offener Tipp pro Kategorie pro Spiel“.
 * Alle Tor-Über/Unter-Linien (1,5 … 5,5) zählen als **eine** Kategorie.
 */
export function profiMarketCategoryKey(marketType: MarketType | string): string {
  const t = String(marketType);
  if (t.startsWith("OVER_UNDER_")) {
    return "GOALS_OVER_UNDER";
  }
  return t;
}
