import { describe, expect, it } from "vitest";
import {
  EXACT_SCORE_CATCH_ALL_LABEL,
  exactScoreOutcomeForPrediction,
  winningExactScoreOutcomes,
} from "./exact-score";

describe("winningExactScoreOutcomes", () => {
  it("liefert konkrete Zeile im 0–3-Raster außer 3:3", () => {
    expect(winningExactScoreOutcomes(2, 1)).toEqual(["2:1"]);
  });

  it("3:3 und alle höheren Ergebnisse → X:X", () => {
    expect(winningExactScoreOutcomes(3, 3)).toEqual([EXACT_SCORE_CATCH_ALL_LABEL]);
    expect(winningExactScoreOutcomes(4, 1)).toEqual([EXACT_SCORE_CATCH_ALL_LABEL]);
  });
});

describe("exactScoreOutcomeForPrediction", () => {
  it("3:3 Vorhersage mappt auf X:X-Option", () => {
    expect(exactScoreOutcomeForPrediction(3, 3)).toBe(EXACT_SCORE_CATCH_ALL_LABEL);
  });
});
