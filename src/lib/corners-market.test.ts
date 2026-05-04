import { describe, expect, it } from "vitest";
import { cornersMatrixOutcomeWins, cornersMatrixThresholdsFromOutcomes } from "./corners-market";

describe("cornersMatrixOutcomeWins", () => {
  it("Exakt n nur bei genau n Ecken", () => {
    expect(cornersMatrixOutcomeWins("CORNERS:E:3", 3)).toBe(true);
    expect(cornersMatrixOutcomeWins("CORNERS:E:3", 4)).toBe(false);
  });

  it("Über n nur wenn total > n", () => {
    expect(cornersMatrixOutcomeWins("CORNERS:O:4", 5)).toBe(true);
    expect(cornersMatrixOutcomeWins("CORNERS:O:4", 4)).toBe(false);
  });

  it("Unter n nur wenn total < n", () => {
    expect(cornersMatrixOutcomeWins("CORNERS:U:3", 2)).toBe(true);
    expect(cornersMatrixOutcomeWins("CORNERS:U:3", 3)).toBe(false);
  });

  it("höhere Schwellen (z. B. ab 6)", () => {
    expect(cornersMatrixOutcomeWins("CORNERS:E:12", 12)).toBe(true);
    expect(cornersMatrixOutcomeWins("CORNERS:O:11", 12)).toBe(true);
  });
});

describe("cornersMatrixThresholdsFromOutcomes", () => {
  it("sammelt sortierte Schwellen aus Optionen", () => {
    expect(
      cornersMatrixThresholdsFromOutcomes([
        "CORNERS:U:6",
        "CORNERS:E:8",
        "CORNERS:O:7",
        "CARDS:E:1",
      ]),
    ).toEqual([6, 7, 8]);
  });
});
