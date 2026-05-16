import { describe, expect, it } from "vitest";
import { leaderboardRankFromRows } from "./leaderboard-rank";

describe("leaderboardRankFromRows", () => {
  it("returns rank by points descending", () => {
    const rows = [
      { id: "a", points: 100 },
      { id: "b", points: 50 },
      { id: "c", points: 200 },
    ];
    expect(leaderboardRankFromRows(rows, "c")).toEqual({ rank: 1, total: 3 });
    expect(leaderboardRankFromRows(rows, "a")).toEqual({ rank: 2, total: 3 });
    expect(leaderboardRankFromRows(rows, "b")).toEqual({ rank: 3, total: 3 });
  });

  it("returns null when user is not in the list", () => {
    expect(leaderboardRankFromRows([{ id: "a", points: 1 }], "missing")).toBeNull();
  });
});
