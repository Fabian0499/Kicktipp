import { exactScoreOutcomeSortIndex } from "@/lib/exact-score";

type MarketOptionLike = {
  id: string;
  outcome: string;
};

const OUTCOME_ORDER: Record<string, string[]> = {
  ONE_X_TWO: ["1", "X", "2"],
  TO_QUALIFY: [
    "QUALIFY:ET:1",
    "QUALIFY:ET:2",
    "QUALIFY:PEN:1",
    "QUALIFY:PEN:2",
    "1",
    "2",
  ],
  BOTH_TEAMS_TO_SCORE: ["Ja", "Nein"],
  HALF_TIME_FULL_TIME: ["1/1", "1/X", "1/2", "X/1", "X/X", "X/2", "2/1", "2/X", "2/2"],
};

function exactScoreOrder(outcome: string): number {
  return exactScoreOutcomeSortIndex(outcome);
}

function matrixOrder(outcome: string, prefix: "GOALS" | "CARDS" | "CORNERS"): number | null {
  const match = outcome.match(new RegExp(`^${prefix}:([UEO]):(\\d+)$`));
  if (!match) {
    return null;
  }
  const kindOrder = { U: 0, E: 1, O: 2 }[match[1] as "U" | "E" | "O"];
  return Number(match[2]) * 10 + kindOrder;
}

function handicapOrder(outcome: string): number | null {
  const match = outcome.match(/^HANDICAP:(\d+):(\d+):([1X2])$/);
  if (!match) {
    return null;
  }
  const homeHandicap = Number(match[1]);
  const awayHandicap = Number(match[2]);
  const outcomeOrder = { "1": 0, X: 1, "2": 2 }[match[3] as "1" | "X" | "2"];
  const lineOrder =
    awayHandicap === 0
      ? homeHandicap
      : 100 + awayHandicap;
  return lineOrder * 10 + outcomeOrder;
}

function optionOrder(marketType: string, outcome: string): number {
  const fixedOrder = OUTCOME_ORDER[marketType];
  if (fixedOrder) {
    const index = fixedOrder.indexOf(outcome);
    return index === -1 ? 999 : index;
  }

  if (marketType === "EXACT_SCORE") {
    return exactScoreOrder(outcome);
  }
  if (marketType === "GOALS_MATRIX") {
    return matrixOrder(outcome, "GOALS") ?? 999;
  }
  if (marketType === "CARDS_MATRIX") {
    return matrixOrder(outcome, "CARDS") ?? 999;
  }
  if (marketType === "CORNERS_MATRIX") {
    return matrixOrder(outcome, "CORNERS") ?? 999;
  }
  if (marketType === "HANDICAP_MATRIX") {
    return handicapOrder(outcome) ?? 999;
  }

  return 999;
}

export function sortMarketOptions<T extends MarketOptionLike>(marketType: string, options: T[]): T[] {
  return [...options].sort((a, b) => {
    const orderA = optionOrder(marketType, a.outcome);
    const orderB = optionOrder(marketType, b.outcome);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id.localeCompare(b.id);
  });
}
