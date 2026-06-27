import { describe, expect, it } from "vitest";
import {
  resolveKnockoutQualifyingTeamIsHome,
  winningQualifyMethodOutcomes,
} from "./to-qualify-method";

describe("winningQualifyMethodOutcomes", () => {
  it("returns empty for regulation", () => {
    expect(winningQualifyMethodOutcomes("REGULATION", 2, 1, undefined)).toEqual([]);
  });

  it("returns ET home when decided in extra time and home wins after ET", () => {
    expect(winningQualifyMethodOutcomes("EXTRA_TIME", 2, 1, undefined)).toEqual(["QUALIFY:ET:1"]);
  });

  it("returns ET away when away wins after extra time", () => {
    expect(winningQualifyMethodOutcomes("EXTRA_TIME", 1, 2, undefined)).toEqual(["QUALIFY:ET:2"]);
  });

  it("returns PEN home when advancing home after penalties", () => {
    expect(winningQualifyMethodOutcomes("PENALTIES", undefined, undefined, true)).toEqual(["QUALIFY:PEN:1"]);
  });

  it("returns PEN away when advancing away after penalties", () => {
    expect(winningQualifyMethodOutcomes("PENALTIES", undefined, undefined, false)).toEqual(["QUALIFY:PEN:2"]);
  });
});

describe("resolveKnockoutQualifyingTeamIsHome", () => {
  it("uses 90-minute score when there is a winner", () => {
    expect(resolveKnockoutQualifyingTeamIsHome({ homeScore: 2, awayScore: 1 })).toBe(true);
  });

  it("uses ET score after draw in regulation", () => {
    expect(
      resolveKnockoutQualifyingTeamIsHome({
        homeScore: 1,
        awayScore: 1,
        knockoutDecidedBy: "EXTRA_TIME",
        homeScoreAfterExtraTime: 2,
        awayScoreAfterExtraTime: 1,
      }),
    ).toBe(true);
  });

  it("uses advancing team after penalties", () => {
    expect(
      resolveKnockoutQualifyingTeamIsHome({
        homeScore: 0,
        awayScore: 0,
        knockoutDecidedBy: "PENALTIES",
        knockoutAdvancingIsHome: false,
      }),
    ).toBe(false);
  });
});
