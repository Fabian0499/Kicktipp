import type { Locale } from "@/lib/i18n/types";

/** Deutsche Mannschaftsnamen (DB / Admin) → englische Anzeige */
const TEAM_NAME_EN: Record<string, string> = {
  Mexiko: "Mexico",
  Südafrika: "South Africa",
  "Republik Korea": "South Korea",
  Tschechien: "Czech Republic",
  Kanada: "Canada",
  "Bosnien und Herzegowina": "Bosnia and Herzegovina",
  Katar: "Qatar",
  Schweiz: "Switzerland",
  Brasilien: "Brazil",
  Marokko: "Morocco",
  Haiti: "Haiti",
  Schottland: "Scotland",
  USA: "USA",
  Paraguay: "Paraguay",
  Australien: "Australia",
  Türkei: "Turkey",
  Deutschland: "Germany",
  Curaçao: "Curaçao",
  "Elfenbeinküste": "Ivory Coast",
  Ecuador: "Ecuador",
  Niederlande: "Netherlands",
  Japan: "Japan",
  Schweden: "Sweden",
  Tunesien: "Tunisia",
  Belgien: "Belgium",
  Ägypten: "Egypt",
  "IR Iran": "Iran",
  Neuseeland: "New Zealand",
  Spanien: "Spain",
  "Kap Verde": "Cape Verde",
  "Saudi-Arabien": "Saudi Arabia",
  Uruguay: "Uruguay",
  Frankreich: "France",
  Senegal: "Senegal",
  Irak: "Iraq",
  Norwegen: "Norway",
  Argentinien: "Argentina",
  Algerien: "Algeria",
  Österreich: "Austria",
  Jordanien: "Jordan",
  Portugal: "Portugal",
  "DR Kongo": "DR Congo",
  Usbekistan: "Uzbekistan",
  Kolumbien: "Colombia",
  England: "England",
  Kroatien: "Croatia",
  Ghana: "Ghana",
  Panama: "Panama",
  Ukraine: "Ukraine",
};

export function displayTeamName(storedName: string, locale: Locale): string {
  const key = storedName.trim();
  if (locale === "en") {
    return TEAM_NAME_EN[key] ?? key;
  }
  return key;
}

export function matchTeamsDisplayLabel(home: string, away: string, locale: Locale): string {
  return `${displayTeamName(home, locale)} vs. ${displayTeamName(away, locale)}`;
}
