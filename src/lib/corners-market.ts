/** Erwartetes Format: CORNERS:U:n, CORNERS:E:n, CORNERS:O:n (n = 0…30 im Admin) */

const CORNERS_MATRIX_N_MAX = 50;

export function cornersMatrixThresholdsFromOutcomes(outcomes: Iterable<string>): number[] {
  const set = new Set<number>();
  for (const o of outcomes) {
    const m = o.match(/^CORNERS:[UEO]:(\d+)$/);
    if (m) {
      set.add(Number(m[1]));
    }
  }
  return [...set].sort((a, b) => a - b);
}

export function cornersMatrixOutcomeWins(outcomeLabel: string, totalCorners: number): boolean {
  const m = outcomeLabel.match(/^CORNERS:([UEO]):(\d+)$/);
  if (!m) {
    return false;
  }
  const kind = m[1];
  const n = Number(m[2]);
  if (!Number.isInteger(n) || n < 0 || n > CORNERS_MATRIX_N_MAX) {
    return false;
  }
  if (kind === "U") {
    return totalCorners < n;
  }
  if (kind === "E") {
    return totalCorners === n;
  }
  if (kind === "O") {
    return totalCorners > n;
  }
  return false;
}

export function formatCornersMatrixOutcomeLabel(outcome: string): string {
  const m = outcome.match(/^CORNERS:([UEO]):(\d+)$/);
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
