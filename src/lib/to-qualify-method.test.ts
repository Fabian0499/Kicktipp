import { describe, expect, it } from "vitest";
import { winningQualifyMethodOutcomes } from "./to-qualify-method";

describe("winningQualifyMethodOutcomes", () => {
  it("returns empty for regulation", () => {
    expect(winningQualifyMethodOutcomes("REGULATION", 2, 1, undefined)).toEqual([]);
  });

  it("returns ET home when decided in extra time and home wins", () => {
    expect(winningQualifyMethodOutcomes("EXTRA_TIME", 2, 1, undefined)).toEqual(["QUALIFY:ET:1"]);
  });

  it("returns ET away when away wins after extra time", () => {
    expect(winningQualifyMethodOutcomes("EXTRA_TIME", 1, 2, undefined)).toEqual(["QUALIFY:ET:2"]);
  });

  it("returns PEN home when tied and advancing home", () => {
    expect(winningQualifyMethodOutcomes("PENALTIES", 1, 1, true)).toEqual(["QUALIFY:PEN:1"]);
  });

  it("returns PEN away when tied and advancing away", () => {
    expect(winningQualifyMethodOutcomes("PENALTIES", 1, 1, false)).toEqual(["QUALIFY:PEN:2"]);
  });
});
