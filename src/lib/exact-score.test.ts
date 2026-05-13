import { describe, expect, it } from "vitest";
import {
  EXACT_SCORE_CATCH_ALL_LABEL,
  exactScoreOutcomeForPrediction,
  winningExactScoreOutcomes,
} from "./exact-score";

describe("winningExactScoreOutcomes", () => {
  it("liefert konkrete Zeile, wenn sie angeboten wird", () => {
    expect(winningExactScoreOutcomes(2, 1)).toEqual(["2:1"]);
    expect(winningExactScoreOutcomes(5, 0)).toEqual(["5:0"]);
  });

  it("Ergebnisse ohne eigene Zeile → X:X", () => {
    expect(winningExactScoreOutcomes(5, 5)).toEqual([EXACT_SCORE_CATCH_ALL_LABEL]);
    expect(winningExactScoreOutcomes(7, 0)).toEqual([EXACT_SCORE_CATCH_ALL_LABEL]);
    expect(winningExactScoreOutcomes(3, 5)).toEqual([EXACT_SCORE_CATCH_ALL_LABEL]);
  });

  it("4:4 ist Unentschieden mit eigener Zeile", () => {
    expect(winningExactScoreOutcomes(4, 4)).toEqual(["4:4"]);
  });
});

describe("exactScoreOutcomeForPrediction", () => {
  it("mappt Vorhersagen auf konkrete oder Sammel-Zeile", () => {
    expect(exactScoreOutcomeForPrediction(3, 3)).toBe("3:3");
    expect(exactScoreOutcomeForPrediction(4, 4)).toBe("4:4");
  });
});
