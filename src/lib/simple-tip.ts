export type ParsedBilloSimpleTip = {
  predictedHome: number;
  predictedAway: number;
};

/** Leere Eingaben sind ungültig (Number("") === 0 würde sonst 0:0 ergeben). */
export function parseBilloSimpleTipInput(
  homeRaw: string,
  awayRaw: string,
): ParsedBilloSimpleTip | null {
  const homeTrim = homeRaw.trim();
  const awayTrim = awayRaw.trim();
  if (homeTrim === "" || awayTrim === "") {
    return null;
  }

  const predictedHome = Number(homeTrim);
  const predictedAway = Number(awayTrim);
  if (
    !Number.isFinite(predictedHome) ||
    !Number.isFinite(predictedAway) ||
    !Number.isInteger(predictedHome) ||
    !Number.isInteger(predictedAway) ||
    predictedHome < 0 ||
    predictedAway < 0 ||
    predictedHome > 30 ||
    predictedAway > 30
  ) {
    return null;
  }

  return { predictedHome, predictedAway };
}
