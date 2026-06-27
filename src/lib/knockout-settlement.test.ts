import { describe, expect, it } from "vitest";
import { validateKnockoutSettlement } from "./match-settlement";

describe("validateKnockoutSettlement", () => {
  const base = {
    isKnockout: true,
    usesQualifyMethodMatrix: true,
  };

  it("allows regulation winner after 90 minutes", () => {
    expect(
      validateKnockoutSettlement({
        ...base,
        homeScore: 2,
        awayScore: 1,
        knockoutDecidedBy: "REGULATION",
      }),
    ).toBeNull();
  });

  it("requires ET scores when decided in extra time", () => {
    expect(
      validateKnockoutSettlement({
        ...base,
        homeScore: 1,
        awayScore: 1,
        knockoutDecidedBy: "EXTRA_TIME",
      }),
    ).toMatch(/Verlängerung/);
  });

  it("allows ET settlement with separate scores", () => {
    expect(
      validateKnockoutSettlement({
        ...base,
        homeScore: 1,
        awayScore: 1,
        knockoutDecidedBy: "EXTRA_TIME",
        homeScoreAfterExtraTime: 2,
        awayScoreAfterExtraTime: 1,
      }),
    ).toBeNull();
  });

  it("requires draw after 90 minutes for penalties", () => {
    expect(
      validateKnockoutSettlement({
        ...base,
        homeScore: 2,
        awayScore: 1,
        knockoutDecidedBy: "PENALTIES",
        knockoutAdvancingIsHome: true,
      }),
    ).toMatch(/90 Minuten/);
  });
});
