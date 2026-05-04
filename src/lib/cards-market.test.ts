import { describe, expect, it } from "vitest";
import { cardsMatrixOutcomeWins, cardsMatrixThresholdsFromOutcomes } from "./cards-market";

describe("cardsMatrixOutcomeWins", () => {
  it("Exakt n gewinnt nur bei genau n Karten", () => {
    expect(cardsMatrixOutcomeWins("CARDS:E:3", 3)).toBe(true);
    expect(cardsMatrixOutcomeWins("CARDS:E:3", 4)).toBe(false);
  });

  it("Über n gewinnt wenn mehr als n", () => {
    expect(cardsMatrixOutcomeWins("CARDS:O:4", 5)).toBe(true);
    expect(cardsMatrixOutcomeWins("CARDS:O:4", 4)).toBe(false);
  });

  it("Unter n gewinnt wenn strikt weniger als n", () => {
    expect(cardsMatrixOutcomeWins("CARDS:U:3", 2)).toBe(true);
    expect(cardsMatrixOutcomeWins("CARDS:U:3", 3)).toBe(false);
  });

  it("unterstützt höhere Schwellen wie bei konfigurierbarer Matrix", () => {
    expect(cardsMatrixOutcomeWins("CARDS:E:12", 12)).toBe(true);
    expect(cardsMatrixOutcomeWins("CARDS:O:10", 11)).toBe(true);
  });
});

describe("cardsMatrixThresholdsFromOutcomes", () => {
  it("sortiert eindeutige Schwellen aus Optionen", () => {
    expect(
      cardsMatrixThresholdsFromOutcomes(["CARDS:U:4", "CARDS:E:6", "CARDS:O:5", "CORNERS:U:1"]),
    ).toEqual([4, 5, 6]);
  });
});
