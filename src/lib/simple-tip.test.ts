import { describe, expect, it } from "vitest";
import { parseBilloSimpleTipInput } from "./simple-tip";

describe("parseBilloSimpleTipInput", () => {
  it("lehnt leere Felder ab", () => {
    expect(parseBilloSimpleTipInput("", "")).toBeNull();
    expect(parseBilloSimpleTipInput("1", "")).toBeNull();
    expect(parseBilloSimpleTipInput("", "2")).toBeNull();
    expect(parseBilloSimpleTipInput("  ", "0")).toBeNull();
  });

  it("akzeptiert gültige Ergebnisse inkl. 0:0 bei expliziter Eingabe", () => {
    expect(parseBilloSimpleTipInput("0", "0")).toEqual({ predictedHome: 0, predictedAway: 0 });
    expect(parseBilloSimpleTipInput("2", "1")).toEqual({ predictedHome: 2, predictedAway: 1 });
  });
});
