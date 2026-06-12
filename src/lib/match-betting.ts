export const MATCH_TIPS_CLOSED_MESSAGE =
  "Das Spiel hat bereits begonnen – keine neuen Tipps mehr möglich.";

export function isMatchOpenForBetting(
  match: { startsAt: Date | string; settledAt?: Date | string | null },
  now: Date = new Date(),
): boolean {
  if (match.settledAt) {
    return false;
  }
  return new Date(match.startsAt).getTime() > now.getTime();
}
