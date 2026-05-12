export const WORLD_CUP_GROUPS = {
  A: ["Mexiko", "Südafrika", "Republik Korea", "Tschechien"],
  B: ["Kanada", "Bosnien und Herzegowina", "Katar", "Schweiz"],
  C: ["Brasilien", "Marokko", "Haiti", "Schottland"],
  D: ["USA", "Paraguay", "Australien", "Türkei"],
  E: ["Deutschland", "Curaçao", "Elfenbeinküste", "Ecuador"],
  F: ["Niederlande", "Japan", "Schweden", "Tunesien"],
  G: ["Belgien", "Ägypten", "IR Iran", "Neuseeland"],
  H: ["Spanien", "Kap Verde", "Saudi-Arabien", "Uruguay"],
  I: ["Frankreich", "Senegal", "Irak", "Norwegen"],
  J: ["Argentinien", "Algerien", "Österreich", "Jordanien"],
  K: ["Portugal", "DR Kongo", "Usbekistan", "Kolumbien"],
  L: ["England", "Kroatien", "Ghana", "Panama"],
} as const;

export const WORLD_CUP_GROUP_CODES = Object.keys(WORLD_CUP_GROUPS) as Array<keyof typeof WORLD_CUP_GROUPS>;

const TEAM_TO_GROUP = new Map<string, string>(
  WORLD_CUP_GROUP_CODES.flatMap((groupCode) =>
    WORLD_CUP_GROUPS[groupCode].map((team) => [team, groupCode] as const),
  ),
);

export function inferWorldCupGroupCode(homeTeam: string, awayTeam: string): string | null {
  const homeGroup = TEAM_TO_GROUP.get(homeTeam.trim());
  const awayGroup = TEAM_TO_GROUP.get(awayTeam.trim());
  if (!homeGroup || !awayGroup || homeGroup !== awayGroup) {
    return null;
  }
  return homeGroup;
}
