import { describe, expect, it } from "vitest";
import {
  formatHandicapMatrixOutcomeLabel,
  handicapMatrixLinesFromOutcomes,
  handicapMatrixOutcomeWins,
} from "./handicap-market";

describe("handicapMatrixOutcomeWins", () => {
  it("wertet 0:n Handicap über den Endstand plus Auswärts-Handicap aus", () => {
    expect(handicapMatrixOutcomeWins("HANDICAP:0:1:1", 2, 0)).toBe(true);
    expect(handicapMatrixOutcomeWins("HANDICAP:0:1:X", 2, 1)).toBe(true);
    expect(handicapMatrixOutcomeWins("HANDICAP:0:2:2", 1, 0)).toBe(true);
  });

  it("wertet n:0 Handicap über den Endstand plus Heim-Handicap aus", () => {
    expect(handicapMatrixOutcomeWins("HANDICAP:1:0:1", 0, 0)).toBe(true);
    expect(handicapMatrixOutcomeWins("HANDICAP:1:0:X", 0, 1)).toBe(true);
    expect(handicapMatrixOutcomeWins("HANDICAP:2:0:2", 0, 3)).toBe(true);
  });

  it("lehnt ungültige Outcomes ab", () => {
    expect(handicapMatrixOutcomeWins("HANDICAP:0:0:X", 0, 0)).toBe(false);
    expect(handicapMatrixOutcomeWins("HANDICAP:1:1:X", 0, 0)).toBe(false);
  });
});

describe("handicapMatrixLinesFromOutcomes", () => {
  it("sortiert eindeutige Handicap-Zeilen", () => {
    expect(
      handicapMatrixLinesFromOutcomes([
        "HANDICAP:2:0:1",
        "HANDICAP:0:3:1",
        "HANDICAP:0:1:X",
        "HANDICAP:1:0:2",
        "CARDS:E:2",
      ]),
    ).toEqual([
      { homeHandicap: 1, awayHandicap: 0 },
      { homeHandicap: 2, awayHandicap: 0 },
      { homeHandicap: 0, awayHandicap: 1 },
      { homeHandicap: 0, awayHandicap: 3 },
    ]);
  });
});

describe("formatHandicapMatrixOutcomeLabel", () => {
  it("formatiert Handicap-Ausgänge lesbar", () => {
    expect(formatHandicapMatrixOutcomeLabel("HANDICAP:1:0:1")).toBe("1:0 Heim");
    expect(formatHandicapMatrixOutcomeLabel("HANDICAP:0:2:X")).toBe("0:2 Unentschieden");
    expect(formatHandicapMatrixOutcomeLabel("HANDICAP:0:2:2")).toBe("0:2 Auswärts");
  });
});
