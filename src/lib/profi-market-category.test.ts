import { MarketType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { profiMarketCategoryKey } from "./profi-market-category";

describe("profiMarketCategoryKey", () => {
  it("maps all goal over/under line types to one category", () => {
    expect(profiMarketCategoryKey("OVER_UNDER_1_5")).toBe("GOALS_OVER_UNDER");
    expect(profiMarketCategoryKey("OVER_UNDER_5_5")).toBe("GOALS_OVER_UNDER");
    expect(profiMarketCategoryKey(MarketType.OVER_UNDER_2_5)).toBe("GOALS_OVER_UNDER");
  });

  it("leaves other market types as distinct categories", () => {
    expect(profiMarketCategoryKey(MarketType.ONE_X_TWO)).toBe("ONE_X_TWO");
    expect(profiMarketCategoryKey(MarketType.BOTH_TEAMS_TO_SCORE)).toBe("BOTH_TEAMS_TO_SCORE");
  });
});
