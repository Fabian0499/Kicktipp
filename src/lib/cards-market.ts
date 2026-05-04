/** Erwartetes Format: CARDS:U:n, CARDS:E:n, CARDS:O:n (n wie im Admin gewählt, bis 50) */

const CARDS_MATRIX_N_MAX = 50;

export function cardsMatrixThresholdsFromOutcomes(outcomes: Iterable<string>): number[] {
  const set = new Set<number>();
  for (const o of outcomes) {
    const m = o.match(/^CARDS:[UEO]:(\d+)$/);
    if (m) {
      set.add(Number(m[1]));
    }
  }
  return [...set].sort((a, b) => a - b);
}

export function cardsMatrixOutcomeWins(outcomeLabel: string, totalCards: number): boolean {
  const m = outcomeLabel.match(/^CARDS:([UEO]):(\d+)$/);
  if (!m) {
    return false;
  }
  const kind = m[1];
  const n = Number(m[2]);
  if (!Number.isInteger(n) || n < 0 || n > CARDS_MATRIX_N_MAX) {
    return false;
  }
  if (kind === "U") {
    return totalCards < n;
  }
  if (kind === "E") {
    return totalCards === n;
  }
  if (kind === "O") {
    return totalCards > n;
  }
  return false;
}

export function formatCardsMatrixOutcomeLabel(outcome: string): string {
  const m = outcome.match(/^CARDS:([UEO]):(\d+)$/);
  if (!m) {
    return outcome;
  }
  const kind = m[1];
  const n = m[2];
  if (kind === "U") {
    return `Unter (${n})`;
  }
  if (kind === "E") {
    return `Exakt ${n}`;
  }
  if (kind === "O") {
    return `Über (${n})`;
  }
  return outcome;
}
