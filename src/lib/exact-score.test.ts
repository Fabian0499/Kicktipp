import { describe, expect, it } from "vitest";
import {
  EXACT_SCORE_CATCH_ALL_LABEL,
  exactScoreOutcomeForPrediction,
  winningExactScoreOutcomes,
} from "./exact-score";

describe("winningExactScoreOutcomes", () => {
  it("liefert konkrete Zeile im 0–4-Raster", () => {
    expect(winningExactScoreOutcomes(2, 1)).toEqual(["2:1"]);
    expect(winningExactScoreOutcomes(4, 4)).toEqual(["4:4"]);
  });

  it("Ergebnisse außerhalb der Matrix → X:X", () => {
    expect(winningExactScoreOutcomes(5, 0)).toEqual([EXACT_SCORE_CATCH_ALL_LABEL]);
    expect(winningExactScoreOutcomes(3, 5)).toEqual([EXACT_SCORE_CATCH_ALL_LABEL]);
  });
});

describe("exactScoreOutcomeForPrediction", () => {
  it("4:4 Vorhersage mappt auf exakte Zeile", () => {
    expect(exactScoreOutcomeForPrediction(4, 4)).toBe("4:4");
  });
});
