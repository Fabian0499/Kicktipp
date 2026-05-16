import { describe, expect, it } from "vitest";
import { displayTeamName, matchTeamsDisplayLabel } from "./team-display-names";

describe("displayTeamName", () => {
  it("returns German name for de locale", () => {
    expect(displayTeamName("Deutschland", "de")).toBe("Deutschland");
  });

  it("returns English name for en locale", () => {
    expect(displayTeamName("Deutschland", "en")).toBe("Germany");
    expect(displayTeamName("Republik Korea", "en")).toBe("South Korea");
  });

  it("falls back to stored name when unknown", () => {
    expect(displayTeamName("Unbekannt FC", "en")).toBe("Unbekannt FC");
  });
});

describe("matchTeamsDisplayLabel", () => {
  it("joins localized team names", () => {
    expect(matchTeamsDisplayLabel("Deutschland", "Frankreich", "en")).toBe("Germany vs. France");
  });
});
