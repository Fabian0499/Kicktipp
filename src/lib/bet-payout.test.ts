import { describe, expect, it } from "vitest";
import { netBetProfitFromGrossReturn, netBetProfitFromOdds } from "./bet-payout";

describe("netBetProfitFromOdds", () => {
  it("credits only profit, not return of stake (100 @ 3.0 → 200)", () => {
    expect(netBetProfitFromOdds(100, 3)).toBe(200);
  });
});

describe("netBetProfitFromGrossReturn", () => {
  it("applies after capping gross return (per-bet limit)", () => {
    expect(netBetProfitFromGrossReturn(400, 100)).toBe(300);
  });
});
