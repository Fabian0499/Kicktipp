/** Sichtbare Rangliste: sortiert nach Punktekonto, wie auf /leaderboard. */
export function leaderboardRankFromRows(
  rows: Array<{ id: string; points: number }>,
  userId: string,
): { rank: number; total: number } | null {
  const sorted = [...rows].sort((a, b) => b.points - a.points);
  const index = sorted.findIndex((row) => row.id === userId);
  if (index < 0) {
    return null;
  }
  return { rank: index + 1, total: sorted.length };
}
