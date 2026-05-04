import { MarketType } from "@prisma/client";

/** Mindestquote für Profi- und Einfach-Tipp-Märkte (außer klassisches 1X2). */
export const MIN_BETTABLE_ODDS = 1.2;

/**
 * @returns true, wenn die Quote für diesen Markt nicht getippt werden darf
 * (alles außer ONE_X_TWO: Quote muss &gt; {@link MIN_BETTABLE_ODDS}).
 * Für **ONE_X_TWO** erlaubt: beliebige Quoten.
 */
export function oddsViolateMinimumForMarket(marketType: MarketType | string, odds: number): boolean {
  if (marketType === MarketType.ONE_X_TWO || marketType === "ONE_X_TWO") {
    return false;
  }
  return odds <= MIN_BETTABLE_ODDS;
}
