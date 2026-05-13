import { describe, expect, it } from "vitest";
import { formatOneXTwoDisplayLabel } from "./one-x-two-display";

describe("formatOneXTwoDisplayLabel", () => {
  it("mappt 1, X, 2 auf Heim, Unentschieden, Auswärts", () => {
    expect(formatOneXTwoDisplayLabel("1", "Deutschland", "Frankreich")).toBe("Deutschland");
    expect(formatOneXTwoDisplayLabel("X", "Deutschland", "Frankreich")).toBe("Unentschieden");
    expect(formatOneXTwoDisplayLabel("2", "Deutschland", "Frankreich")).toBe("Frankreich");
  });
});
