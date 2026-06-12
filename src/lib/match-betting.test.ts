import { describe, expect, it } from "vitest";
import { isMatchOpenForBetting, MATCH_TIPS_CLOSED_MESSAGE } from "./match-betting";

describe("isMatchOpenForBetting", () => {
  const now = new Date("2026-06-15T18:00:00.000Z");

  it("allows tips before kickoff", () => {
    expect(
      isMatchOpenForBetting({ startsAt: "2026-06-15T19:00:00.000Z", settledAt: null }, now),
    ).toBe(true);
  });

  it("blocks tips at or after kickoff", () => {
    expect(
      isMatchOpenForBetting({ startsAt: "2026-06-15T18:00:00.000Z", settledAt: null }, now),
    ).toBe(false);
    expect(
      isMatchOpenForBetting({ startsAt: "2026-06-15T17:00:00.000Z", settledAt: null }, now),
    ).toBe(false);
  });

  it("blocks tips when match is settled", () => {
    expect(
      isMatchOpenForBetting(
        { startsAt: "2026-06-20T19:00:00.000Z", settledAt: "2026-06-15T21:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("exports a user-facing message", () => {
    expect(MATCH_TIPS_CLOSED_MESSAGE.length).toBeGreaterThan(10);
  });
});
