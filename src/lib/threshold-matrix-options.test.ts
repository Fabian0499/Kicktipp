import { describe, expect, it } from "vitest";
import {
  buildThresholdMatrixOptions,
  parseThresholdMatrixRowsFromOptions,
} from "./threshold-matrix-options";

describe("threshold matrix options", () => {
  it("builds cards rows with and without unter at N=0", () => {
    expect(
      buildThresholdMatrixOptions("CARDS", 0, [
        { exakt: 3.1, uber: 2.2 },
        { unter: 1.5, exakt: 4.4, uber: 5.5 },
      ]),
    ).toEqual([
      { outcome: "CARDS:E:0", odds: 3.1 },
      { outcome: "CARDS:O:0", odds: 2.2 },
      { outcome: "CARDS:U:1", odds: 1.5 },
      { outcome: "CARDS:E:1", odds: 4.4 },
      { outcome: "CARDS:O:1", odds: 5.5 },
    ]);
  });

  it("roundtrips parsed rows from options", () => {
    const options = buildThresholdMatrixOptions("CORNERS", 6, [
      { unter: 1.8, exakt: 2.9, uber: 3.1 },
      { unter: 2.0, exakt: 2.1, uber: 2.2 },
    ]);

    expect(parseThresholdMatrixRowsFromOptions("CORNERS", options, 6, 2)).toEqual([
      { unter: 1.8, exakt: 2.9, uber: 3.1 },
      { unter: 2.0, exakt: 2.1, uber: 2.2 },
    ]);
  });
});
