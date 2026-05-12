import { describe, expect, it } from "vitest";
import { payoutFromGrossReturn, payoutFromOdds } from "./bet-payout";

describe("payoutFromOdds", () => {
  it("credits full payout including stake (100 @ 2.0 → 200)", () => {
    expect(payoutFromOdds(100, 2)).toBe(200);
  });
});

describe("payoutFromGrossReturn", () => {
  it("returns capped gross return directly", () => {
    expect(payoutFromGrossReturn(400)).toBe(400);
  });
});
