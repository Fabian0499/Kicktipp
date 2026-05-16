import { describe, expect, it } from "vitest";
import { profiBetConflictsOpenSet, profiBetsMutuallyAbsorbing } from "./betting-conflicts";

describe("profiBetsMutuallyAbsorbing", () => {
  it("does not block 1 and X on 1X2 (draw and away are uncovered)", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "ONE_X_TWO", outcomeLabel: "1" },
        { marketType: "ONE_X_TWO", outcomeLabel: "X" },
      ),
    ).toBe(false);
  });

  it("blocks Über/Unter on the same line", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "OVER_UNDER_1_5", outcomeLabel: "Über 1.5" },
        { marketType: "OVER_UNDER_1_5", outcomeLabel: "Unter 1.5" },
      ),
    ).toBe(true);
  });

  it("blocks Qualifiziert sich Heim (1) und Gast (2) gleichzeitig", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "TO_QUALIFY", outcomeLabel: "1" },
        { marketType: "TO_QUALIFY", outcomeLabel: "2" },
      ),
    ).toBe(true);
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "TO_QUALIFY", outcomeLabel: "2" },
        { marketType: "TO_QUALIFY", outcomeLabel: "1" },
      ),
    ).toBe(true);
  });

  it("does not block zwei gleiche Qualifikations-Tipps (falls erlaubt)", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "TO_QUALIFY", outcomeLabel: "1" },
        { marketType: "TO_QUALIFY", outcomeLabel: "1" },
      ),
    ).toBe(false);
  });

  it("sperrt Karten-Matrix Unter(4) + Über(3) (volle Abdeckung aller Karten-Totals)", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "CARDS_MATRIX", outcomeLabel: "CARDS:O:3" },
        { marketType: "CARDS_MATRIX", outcomeLabel: "CARDS:U:4" },
      ),
    ).toBe(true);
  });

  it("sperrt Ecken-Matrix genauso (Unter m + Über m-1)", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "CORNERS_MATRIX", outcomeLabel: "CORNERS:U:6" },
        { marketType: "CORNERS_MATRIX", outcomeLabel: "CORNERS:O:5" },
      ),
    ).toBe(true);
  });

  it("sperrt nicht Karten Über(3) und Unter(3) – bei genau 3 gewinnt keiner der beiden", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "CARDS_MATRIX", outcomeLabel: "CARDS:O:3" },
        { marketType: "CARDS_MATRIX", outcomeLabel: "CARDS:U:3" },
      ),
    ).toBe(false);
  });

  it("sperrt zwei verschiedene KO-Methode-Tipps (z. B. Verlängerung Heim vs. Elfmeter Gast)", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "TO_QUALIFY", outcomeLabel: "QUALIFY:ET:1" },
        { marketType: "TO_QUALIFY", outcomeLabel: "QUALIFY:PEN:2" },
      ),
    ).toBe(true);
  });

  it("sperrt 1X2 Heimsieg und Handicap 0:1 mit Gewinn Auswärts (volle H/D/A-Abdeckung)", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "ONE_X_TWO", outcomeLabel: "1" },
        { marketType: "HANDICAP_MATRIX", outcomeLabel: "HANDICAP:0:1:2" },
      ),
    ).toBe(true);
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "HANDICAP_MATRIX", outcomeLabel: "HANDICAP:0:1:2" },
        { marketType: "ONE_X_TWO", outcomeLabel: "1" },
      ),
    ).toBe(true);
  });

  it("sperrt nicht Karten und Ecken gegeneinander", () => {
    expect(
      profiBetsMutuallyAbsorbing(
        { marketType: "CARDS_MATRIX", outcomeLabel: "CARDS:U:4" },
        { marketType: "CORNERS_MATRIX", outcomeLabel: "CORNERS:O:3" },
      ),
    ).toBe(false);
  });
});

describe("profiBetConflictsOpenSet", () => {
  it("blocks 1X2 third outcome when two singles already cover Heim and Unentschieden", () => {
    expect(
      profiBetConflictsOpenSet(
        { marketType: "ONE_X_TWO", outcomeLabel: "2" },
        [
          { marketType: "ONE_X_TWO", outcomeLabel: "1" },
          { marketType: "ONE_X_TWO", outcomeLabel: "X" },
        ],
      ),
    ).toBe(true);
  });

  it("still allows only two of three 1X2 outcomes", () => {
    expect(
      profiBetConflictsOpenSet(
        { marketType: "ONE_X_TWO", outcomeLabel: "X" },
        [{ marketType: "ONE_X_TWO", outcomeLabel: "1" }],
      ),
    ).toBe(false);
  });

  it("sperrt Handicap-Kandidat, wenn offener 1X2-Tipp mit ihm H/D/A vollständig abdeckt", () => {
    expect(
      profiBetConflictsOpenSet(
        { marketType: "HANDICAP_MATRIX", outcomeLabel: "HANDICAP:0:1:2" },
        [{ marketType: "ONE_X_TWO", outcomeLabel: "1" }],
      ),
    ).toBe(true);
  });

  it("sperrt Handicap 2:0 Heim nicht ohne weitere offene Tipps (breite, aber keine Absicherung)", () => {
    expect(
      profiBetConflictsOpenSet(
        { marketType: "HANDICAP_MATRIX", outcomeLabel: "HANDICAP:2:0:1" },
        [],
      ),
    ).toBe(false);
  });
});
