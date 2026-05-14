import { describe, expect, it } from "vitest";
import { formatHalfTimeFullTimeDisplayLabel, formatOneXTwoDisplayLabel } from "./one-x-two-display";

describe("formatOneXTwoDisplayLabel", () => {
  it("mappt 1, X, 2 auf Heim, Unentschieden, Auswärts", () => {
    expect(formatOneXTwoDisplayLabel("1", "Deutschland", "Frankreich")).toBe("Deutschland");
    expect(formatOneXTwoDisplayLabel("X", "Deutschland", "Frankreich")).toBe("Unentschieden");
    expect(formatOneXTwoDisplayLabel("2", "Deutschland", "Frankreich")).toBe("Frankreich");
  });
});

describe("formatHalfTimeFullTimeDisplayLabel", () => {
  it("ersetzt 1/X/2 durch Heim, Unentschieden, Auswärts (Halbzeit / Endstand)", () => {
    expect(formatHalfTimeFullTimeDisplayLabel("1/X", "Deutschland", "Spanien")).toBe(
      "Deutschland / Unentschieden",
    );
    expect(formatHalfTimeFullTimeDisplayLabel("2/2", "Deutschland", "Spanien")).toBe("Spanien / Spanien");
    expect(formatHalfTimeFullTimeDisplayLabel("X/X", "Deutschland", "Spanien")).toBe(
      "Unentschieden / Unentschieden",
    );
    expect(formatHalfTimeFullTimeDisplayLabel("2/1", "Deutschland", "Spanien")).toBe("Spanien / Deutschland");
  });
});
