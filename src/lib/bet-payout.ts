/**
 * Net profit to credit to the points account for a winning decimal-odds bet.
 * The stake was already reserved/debited when the bet was placed; only the
 * profit (gross return minus stake) is a new credit.
 */
export function netBetProfitFromOdds(stake: number, oddsSnapshot: number): number {
  const grossReturn = Math.round(stake * oddsSnapshot);
  return netBetProfitFromGrossReturn(grossReturn, stake);
}

/** Same as {@link netBetProfitFromOdds}, but when gross return was already rounded/capped. */
export function netBetProfitFromGrossReturn(grossReturnRounded: number, stake: number): number {
  return Math.max(0, grossReturnRounded - stake);
}
