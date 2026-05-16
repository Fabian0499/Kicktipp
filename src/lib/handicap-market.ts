/** Erwartetes Format: HANDICAP:h:a:1, HANDICAP:h:a:X, HANDICAP:h:a:2 */

const HANDICAP_GOALS_MAX = 30;

export type HandicapMatrixLine = {
  homeHandicap: number;
  awayHandicap: number;
};

function resultSymbol(homeScore: number, awayScore: number): "1" | "X" | "2" {
  if (homeScore > awayScore) return "1";
  if (homeScore < awayScore) return "2";
  return "X";
}

function parseHandicapOutcome(outcome: string):
  | {
      homeHandicap: number;
      awayHandicap: number;
      pickedOutcome: "1" | "X" | "2";
    }
  | null {
  const match = outcome.match(/^HANDICAP:(\d+):(\d+):([1X2])$/);
  if (!match) {
    return null;
  }

  const homeHandicap = Number(match[1]);
  const awayHandicap = Number(match[2]);
  const pickedOutcome = match[3] as "1" | "X" | "2";
  const hasExactlyOneHandicapSide =
    (homeHandicap > 0 && awayHandicap === 0) || (homeHandicap === 0 && awayHandicap > 0);
  if (
    !Number.isInteger(homeHandicap) ||
    !Number.isInteger(awayHandicap) ||
    homeHandicap < 0 ||
    awayHandicap < 0 ||
    homeHandicap > HANDICAP_GOALS_MAX ||
    awayHandicap > HANDICAP_GOALS_MAX ||
    !hasExactlyOneHandicapSide
  ) {
    return null;
  }

  return { homeHandicap, awayHandicap, pickedOutcome };
}

export function handicapMatrixLinesFromOutcomes(outcomes: Iterable<string>): HandicapMatrixLine[] {
  const map = new Map<string, HandicapMatrixLine>();
  for (const outcome of outcomes) {
    const parsed = parseHandicapOutcome(outcome);
    if (parsed) {
      map.set(`${parsed.homeHandicap}:${parsed.awayHandicap}`, {
        homeHandicap: parsed.homeHandicap,
        awayHandicap: parsed.awayHandicap,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.awayHandicap === 0 && b.awayHandicap > 0) return -1;
    if (a.awayHandicap > 0 && b.awayHandicap === 0) return 1;
    return (a.homeHandicap || a.awayHandicap) - (b.homeHandicap || b.awayHandicap);
  });
}

export function handicapMatrixOutcomeWins(outcomeLabel: string, homeScore: number, awayScore: number): boolean {
  const parsed = parseHandicapOutcome(outcomeLabel);
  if (!parsed) {
    return false;
  }

  return (
    resultSymbol(homeScore + parsed.homeHandicap, awayScore + parsed.awayHandicap) === parsed.pickedOutcome
  );
}

export function formatHandicapMatrixOutcomeLabel(
  outcome: string,
  homeLabel = "Heim",
  awayLabel = "Auswärts",
  drawLabel = "Unentschieden",
): string {
  const parsed = parseHandicapOutcome(outcome);
  if (!parsed) {
    return outcome;
  }

  const handicap = `${parsed.homeHandicap}:${parsed.awayHandicap}`;
  if (parsed.pickedOutcome === "1") {
    return `${handicap} ${homeLabel}`;
  }
  if (parsed.pickedOutcome === "X") {
    return `${handicap} ${drawLabel}`;
  }
  return `${handicap} ${awayLabel}`;
}
