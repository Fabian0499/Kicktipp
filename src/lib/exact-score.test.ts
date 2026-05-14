import { describe, expect, it } from "vitest";
import { exactScoreOutcomeForPrediction, winningExactScoreOutcomes } from "./exact-score";

describe("winningExactScoreOutcomes", () => {
  it("liefert konkrete Zeile, wenn sie angeboten wird", () => {
    expect(winningExactScoreOutcomes(2, 1)).toEqual(["2:1"]);
    expect(winningExactScoreOutcomes(5, 0)).toEqual(["5:0"]);
  });

  it("Ergebnisse ohne eigene Zeile → kein Treffer (keine Sammelquote mehr)", () => {
    expect(winningExactScoreOutcomes(5, 5)).toEqual([]);
    expect(winningExactScoreOutcomes(7, 0)).toEqual([]);
    expect(winningExactScoreOutcomes(3, 5)).toEqual([]);
  });

  it("4:4 ist Unentschieden mit eigener Zeile", () => {
    expect(winningExactScoreOutcomes(4, 4)).toEqual(["4:4"]);
  });
});

describe("exactScoreOutcomeForPrediction", () => {
  it("liefert immer das erwartete Ergebnis als Label", () => {
    expect(exactScoreOutcomeForPrediction(3, 3)).toBe("3:3");
    expect(exactScoreOutcomeForPrediction(4, 4)).toBe("4:4");
    expect(exactScoreOutcomeForPrediction(7, 0)).toBe("7:0");
  });
});
