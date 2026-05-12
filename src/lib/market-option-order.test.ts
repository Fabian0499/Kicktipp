import { describe, expect, it } from "vitest";
import { sortMarketOptions } from "./market-option-order";

describe("sortMarketOptions", () => {
  it("sortiert 1X2 stabil als 1, X, 2", () => {
    const sorted = sortMarketOptions("ONE_X_TWO", [
      { id: "c", outcome: "2" },
      { id: "a", outcome: "X" },
      { id: "b", outcome: "1" },
    ]);

    expect(sorted.map((option) => option.outcome)).toEqual(["1", "X", "2"]);
  });

  it("sortiert Matrix-Optionen nach Schwelle und Unter/Exakt/Über", () => {
    const sorted = sortMarketOptions("GOALS_MATRIX", [
      { id: "c", outcome: "GOALS:O:1" },
      { id: "a", outcome: "GOALS:E:1" },
      { id: "b", outcome: "GOALS:U:1" },
    ]);

    expect(sorted.map((option) => option.outcome)).toEqual(["GOALS:U:1", "GOALS:E:1", "GOALS:O:1"]);
  });
});
