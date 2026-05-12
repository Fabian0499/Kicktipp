/** Payout to credit for a winning decimal-odds bet (stake * odds). */
export function payoutFromOdds(stake: number, oddsSnapshot: number): number {
  return Math.max(0, Math.round(stake * oddsSnapshot));
}

/** Same as {@link payoutFromOdds}, but when gross return was already rounded/capped. */
export function payoutFromGrossReturn(grossReturnRounded: number): number {
  return Math.max(0, grossReturnRounded);
}
