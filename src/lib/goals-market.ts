/** Erwartetes Format: GOALS:U:n, GOALS:E:n, GOALS:O:n */

import type { Locale } from "@/lib/i18n/types";

const GOALS_MATRIX_N_MAX = 50;

export function goalsMatrixThresholdsFromOutcomes(outcomes: Iterable<string>): number[] {
  const set = new Set<number>();
  for (const outcome of outcomes) {
    const match = outcome.match(/^GOALS:[UEO]:(\d+)$/);
    if (match) {
      set.add(Number(match[1]));
    }
  }
  return [...set].sort((a, b) => a - b);
}

export function goalsMatrixOutcomeWins(outcomeLabel: string, totalGoals: number): boolean {
  const match = outcomeLabel.match(/^GOALS:([UEO]):(\d+)$/);
  if (!match) {
    return false;
  }

  const kind = match[1];
  const n = Number(match[2]);
  if (!Number.isInteger(n) || n < 0 || n > GOALS_MATRIX_N_MAX) {
    return false;
  }
  if (kind === "U") {
    return totalGoals < n;
  }
  if (kind === "E") {
    return totalGoals === n;
  }
  if (kind === "O") {
    return totalGoals > n;
  }
  return false;
}

export function formatGoalsMatrixOutcomeLabel(outcome: string, locale: Locale = "de"): string {
  const match = outcome.match(/^GOALS:([UEO]):(\d+)$/);
  if (!match) {
    return outcome;
  }

  const kind = match[1];
  const n = match[2];
  if (locale === "en") {
    const goalWord = n === "1" ? "goal" : "goals";
    if (kind === "U") {
      return `Under ${n} ${goalWord}`;
    }
    if (kind === "E") {
      return `Exactly ${n} ${goalWord}`;
    }
    if (kind === "O") {
      return `Over ${n} ${goalWord}`;
    }
    return outcome;
  }
  if (kind === "U") {
    return `Unter ${n} ${n === "1" ? "Tor" : "Tore"}`;
  }
  if (kind === "E") {
    return `Exakt ${n} ${n === "1" ? "Tor" : "Tore"}`;
  }
  if (kind === "O") {
    return `Über ${n} ${n === "1" ? "Tor" : "Tore"}`;
  }
  return outcome;
}
