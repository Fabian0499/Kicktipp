import { describe, expect, it } from "vitest";
import { formatGoalsMatrixOutcomeLabel, goalsMatrixOutcomeWins, goalsMatrixThresholdsFromOutcomes } from "./goals-market";

describe("goalsMatrixOutcomeWins", () => {
  it("wertet Unter, Exakt und Über anhand der Gesamttore aus", () => {
    expect(goalsMatrixOutcomeWins("GOALS:U:2", 1)).toBe(true);
    expect(goalsMatrixOutcomeWins("GOALS:E:2", 2)).toBe(true);
    expect(goalsMatrixOutcomeWins("GOALS:O:2", 3)).toBe(true);
    expect(goalsMatrixOutcomeWins("GOALS:O:2", 2)).toBe(false);
  });
});

describe("goalsMatrixThresholdsFromOutcomes", () => {
  it("sortiert eindeutige Schwellen", () => {
    expect(goalsMatrixThresholdsFromOutcomes(["GOALS:O:3", "GOALS:E:1", "CARDS:E:2"])).toEqual([1, 3]);
  });
});

describe("formatGoalsMatrixOutcomeLabel", () => {
  it("formatiert Torlinien lesbar", () => {
    expect(formatGoalsMatrixOutcomeLabel("GOALS:U:1")).toBe("Unter 1 Tor");
    expect(formatGoalsMatrixOutcomeLabel("GOALS:E:2")).toBe("Exakt 2 Tore");
    expect(formatGoalsMatrixOutcomeLabel("GOALS:O:3")).toBe("Über 3 Tore");
  });
});
