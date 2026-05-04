import { MarketType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { oddsViolateMinimumForMarket } from "./min-bettable-odds";

describe("oddsViolateMinimumForMarket", () => {
  it("allows any odds on ONE_X_TWO", () => {
    expect(oddsViolateMinimumForMarket(MarketType.ONE_X_TWO, 1.05)).toBe(false);
    expect(oddsViolateMinimumForMarket("ONE_X_TWO", 1.0)).toBe(false);
  });

  it("blocks low odds on other markets", () => {
    expect(oddsViolateMinimumForMarket(MarketType.EXACT_SCORE, 1.2)).toBe(true);
    expect(oddsViolateMinimumForMarket(MarketType.EXACT_SCORE, 1.21)).toBe(false);
  });
});
