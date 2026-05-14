import type { MarketType } from "@prisma/client";
import { handicapMatrixOutcomeWins } from "@/lib/handicap-market";

/** Full-time 1X2 outcome atoms */
export type FtAtom = "H" | "D" | "A";

export type BetConflictInput = {
  marketType: MarketType;
  outcomeLabel: string;
};

function normalizeOutcome(raw: string): string {
  return raw.trim().toLowerCase();
}

function parseOneXTwoOutcome(outcome: string): Set<FtAtom> | null {
  const o = normalizeOutcome(outcome);
  if (o === "1") {
    return new Set(["H"]);
  }
  if (o === "x") {
    return new Set(["D"]);
  }
  if (o === "2") {
    return new Set(["A"]);
  }
  return null;
}

function parseDoubleChanceOutcome(outcome: string): Set<FtAtom> | null {
  const o = normalizeOutcome(outcome).replace(/\s/g, "");
  if (o === "1x") {
    return new Set(["H", "D"]);
  }
  if (o === "x2") {
    return new Set(["D", "A"]);
  }
  if (o === "12") {
    return new Set(["H", "A"]);
  }
  return null;
}

function ftCoverage(bet: BetConflictInput): Set<FtAtom> | null {
  if (bet.marketType === "ONE_X_TWO") {
    return parseOneXTwoOutcome(bet.outcomeLabel);
  }
  if (bet.marketType === "DOUBLE_CHANCE") {
    return parseDoubleChanceOutcome(bet.outcomeLabel);
  }
  if (bet.marketType === "TO_QUALIFY") {
    return parseOneXTwoOutcome(bet.outcomeLabel);
  }
  if (bet.marketType === "HANDICAP_MATRIX") {
    return handicapMatrixFtCoverage(bet.outcomeLabel);
  }
  return null;
}

const HANDICAP_FT_SCAN_MAX = 25;

/**
 * Menge der regulären Endergebnis-Typen (H/D/A), für die diese Handicap-Wette gewinnen kann.
 * Dient der Absicherungsprüfung mit 1X2 / Doppelchance / weiterem Handicap.
 */
function handicapMatrixFtCoverage(outcomeLabel: string): Set<FtAtom> | null {
  if (!/^HANDICAP:\d+:\d+:[1X2]$/i.test(outcomeLabel.trim())) {
    return null;
  }
  const covered = new Set<FtAtom>();
  const max = HANDICAP_FT_SCAN_MAX;
  for (let home = 0; home <= max; home += 1) {
    for (let away = 0; away <= max; away += 1) {
      if (!handicapMatrixOutcomeWins(outcomeLabel, home, away)) {
        continue;
      }
      if (home > away) {
        covered.add("H");
      } else if (home < away) {
        covered.add("A");
      } else {
        covered.add("D");
      }
    }
  }
  return covered.size > 0 ? covered : null;
}

function isOverUnderType(type: MarketType): boolean {
  return (
    type === "OVER_UNDER_1_5" ||
    type === "OVER_UNDER_2_5" ||
    type === "OVER_UNDER_3_5" ||
    type === "OVER_UNDER_4_5" ||
    type === "OVER_UNDER_5_5"
  );
}

type OuPolarity = "OVER" | "UNDER";

function parseOverUnderPolarity(outcomeLabel: string): OuPolarity | null {
  const o = normalizeOutcome(outcomeLabel);
  if (o.startsWith("über") || o.startsWith("over")) {
    return "OVER";
  }
  if (o.startsWith("unter") || o.startsWith("under")) {
    return "UNDER";
  }
  return null;
}

function parseBothTeamsPolarity(outcomeLabel: string): "JA" | "NEIN" | null {
  const o = normalizeOutcome(outcomeLabel);
  if (o === "ja" || o === "yes") {
    return "JA";
  }
  if (o === "nein" || o === "no") {
    return "NEIN";
  }
  return null;
}

function isQualifyMethodOutcomeLabel(outcome: string): boolean {
  const o = normalizeOutcome(outcome);
  return o.startsWith("qualify:et:") || o.startsWith("qualify:pen:");
}

/** CARDS:CORNERS-Kachel: PREFIX:U|O|E:n */
function parseCardsCornersMatrixOutcome(
  outcomeLabel: string,
): { prefix: "CARDS" | "CORNERS"; kind: "U" | "O" | "E"; n: number } | null {
  let m = outcomeLabel.match(/^CARDS:([UEO]):(\d+)$/);
  if (m) {
    return { prefix: "CARDS", kind: m[1] as "U" | "O" | "E", n: Number(m[2]) };
  }
  m = outcomeLabel.match(/^CORNERS:([UEO]):(\d+)$/);
  if (m) {
    return { prefix: "CORNERS", kind: m[1] as "U" | "O" | "E", n: Number(m[2]) };
  }
  return null;
}

function matrixMarketMatchesPrefix(marketType: string, prefix: "CARDS" | "CORNERS"): boolean {
  return (
    (marketType === "CARDS_MATRIX" && prefix === "CARDS") ||
    (marketType === "CORNERS_MATRIX" && prefix === "CORNERS")
  );
}

/**
 * Karten-/Ecken-Matrix: Unter(m) gewinnt bei total &lt; m, Über(k) bei total &gt; k.
 * Für ganzzahlige Totale partitionieren U:(k+1) und O:k die Menge ℕ₀ — garantiert genau einen Treffer.
 */
function matrixUnderOverPartitionHedge(a: BetConflictInput, b: BetConflictInput): boolean {
  const ta = a.marketType as string;
  const tb = b.marketType as string;
  if (ta !== tb) {
    return false;
  }
  if (ta !== "CARDS_MATRIX" && ta !== "CORNERS_MATRIX") {
    return false;
  }

  const pa = parseCardsCornersMatrixOutcome(a.outcomeLabel);
  const pb = parseCardsCornersMatrixOutcome(b.outcomeLabel);
  if (!pa || !pb || pa.prefix !== pb.prefix) {
    return false;
  }
  if (!matrixMarketMatchesPrefix(ta, pa.prefix)) {
    return false;
  }

  if (pa.kind === "U" && pb.kind === "O" && pa.n === pb.n + 1) {
    return true;
  }
  if (pb.kind === "U" && pa.kind === "O" && pb.n === pa.n + 1) {
    return true;
  }
  return false;
}

/**
 * True if together these two OPEN bets would guarantee at least one winner on normal 90'+ outcome
 * (same match). Used to block "Absicherungs"-Kombinationen in der Profi-Variante.
 */
export function profiBetsMutuallyAbsorbing(a: BetConflictInput, b: BetConflictInput): boolean {
  const covA = ftCoverage(a);
  const covB = ftCoverage(b);
  if (covA && covB) {
    const union = new Set<FtAtom>([...covA, ...covB]);
    if (union.has("H") && union.has("D") && union.has("A")) {
      return true;
    }
  }

  if (isOverUnderType(a.marketType) && isOverUnderType(b.marketType) && a.marketType === b.marketType) {
    const pa = parseOverUnderPolarity(a.outcomeLabel);
    const pb = parseOverUnderPolarity(b.outcomeLabel);
    if (pa && pb && pa !== pb) {
      return true;
    }
  }

  if (a.marketType === "BOTH_TEAMS_TO_SCORE" && b.marketType === "BOTH_TEAMS_TO_SCORE") {
    const pa = parseBothTeamsPolarity(a.outcomeLabel);
    const pb = parseBothTeamsPolarity(b.outcomeLabel);
    if (pa && pb && pa !== pb) {
      return true;
    }
  }

  // Qualifikation: nur eine Seite tipbar – Heim (1) und Gast (2) gleichzeitig wäre Absicherung
  if (a.marketType === "TO_QUALIFY" && b.marketType === "TO_QUALIFY") {
    const oa = normalizeOutcome(a.outcomeLabel);
    const ob = normalizeOutcome(b.outcomeLabel);
    if ((oa === "1" && ob === "2") || (oa === "2" && ob === "1")) {
      return true;
    }
    if (
      isQualifyMethodOutcomeLabel(a.outcomeLabel) &&
      isQualifyMethodOutcomeLabel(b.outcomeLabel) &&
      oa !== ob
    ) {
      return true;
    }
  }

  if (matrixUnderOverPartitionHedge(a, b)) {
    return true;
  }

  return false;
}

function unionFtAtomsFromBets(bets: BetConflictInput[]): Set<FtAtom> {
  const union = new Set<FtAtom>();
  for (const bet of bets) {
    const cov = ftCoverage(bet);
    if (cov) {
      for (const atom of cov) {
        union.add(atom);
      }
    }
  }
  return union;
}

export function profiBetConflictsOpenSet(
  candidate: BetConflictInput,
  openBets: BetConflictInput[],
): boolean {
  const ftAtomsAllTips = unionFtAtomsFromBets([...openBets, candidate]);
  if (ftAtomsAllTips.has("H") && ftAtomsAllTips.has("D") && ftAtomsAllTips.has("A")) {
    return true;
  }
  return openBets.some((open) => profiBetsMutuallyAbsorbing(candidate, open));
}
