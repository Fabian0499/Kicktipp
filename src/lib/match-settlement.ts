import { BetStatus, MarketType, PointTransactionType, type Prisma } from "@prisma/client";
import { cardsMatrixOutcomeWins } from "@/lib/cards-market";
import { cornersMatrixOutcomeWins } from "@/lib/corners-market";
import { goalsMatrixOutcomeWins } from "@/lib/goals-market";
import { handicapMatrixOutcomeWins } from "@/lib/handicap-market";
import { winningExactScoreOutcomes } from "@/lib/exact-score";
import { payoutFromGrossReturn } from "@/lib/bet-payout";
import {
  isQualifyMethodOutcome,
  qualifyMarketUsesMethodMatrix,
  resolveKnockoutQualifyingTeamIsHome,
  winningQualifyMethodOutcomes,
  type KnockoutDecidedBy,
} from "@/lib/to-qualify-method";

export const LEAGUE_MAX_PAYOUT_PER_BET = 400;
export const LEAGUE_MAX_PAYOUT_PER_MATCH = 600;
export const KO_MAX_PAYOUT_PER_BET = 600;
export const KO_MAX_PAYOUT_PER_MATCH = 900;

type SettlementBet = {
  id: string;
  userId: string;
  marketType: MarketType;
  marketTitle: string;
  outcomeLabel: string;
  stake: number;
  oddsSnapshot: number;
};

export type MatchSettlementInput = {
  homeHalfTimeScore: number;
  awayHalfTimeScore: number;
  /** Ergebnis nach 90 Minuten – gilt für alle Standard-Märkte (1X2, Tore, …) */
  homeScore: number;
  awayScore: number;
  totalCards: number;
  totalCorners: number;
  knockoutDecidedBy?: KnockoutDecidedBy;
  homeScoreAfterExtraTime?: number;
  awayScoreAfterExtraTime?: number;
  knockoutAdvancingIsHome?: boolean;
};

type MatchForSettlement = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  isKnockout: boolean;
};

type DbTx = Prisma.TransactionClient;

function getResultSymbol(home: number, away: number) {
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}

export function getWinningOutcomeLabels(
  marketType: MarketType,
  homeHalfTimeScore: number,
  awayHalfTimeScore: number,
  homeScore: number,
  awayScore: number,
) {
  const totalGoals = homeScore + awayScore;
  const halfTimeSymbol = getResultSymbol(homeHalfTimeScore, awayHalfTimeScore);
  const fullTimeSymbol = getResultSymbol(homeScore, awayScore);

  if (marketType === MarketType.ONE_X_TWO) {
    return [fullTimeSymbol];
  }

  if (marketType === ("HALF_TIME_ONE_X_TWO" as MarketType)) {
    return [halfTimeSymbol];
  }

  if (marketType === ("HALF_TIME_FULL_TIME" as MarketType)) {
    return [`${halfTimeSymbol}/${fullTimeSymbol}`];
  }

  if (marketType === ("EXACT_SCORE" as MarketType)) {
    return winningExactScoreOutcomes(homeScore, awayScore);
  }

  if (marketType === ("OVER_UNDER_1_5" as MarketType)) {
    return totalGoals > 1.5 ? ["Über 1.5"] : ["Unter 1.5"];
  }

  if (marketType === MarketType.OVER_UNDER_2_5) {
    return totalGoals > 2.5 ? ["Über 2.5"] : ["Unter 2.5"];
  }

  if (marketType === ("OVER_UNDER_3_5" as MarketType)) {
    return totalGoals > 3.5 ? ["Über 3.5"] : ["Unter 3.5"];
  }

  if (marketType === ("OVER_UNDER_4_5" as MarketType)) {
    return totalGoals > 4.5 ? ["Über 4.5"] : ["Unter 4.5"];
  }

  if (marketType === ("OVER_UNDER_5_5" as MarketType)) {
    return totalGoals > 5.5 ? ["Über 5.5"] : ["Unter 5.5"];
  }

  if (marketType === MarketType.BOTH_TEAMS_TO_SCORE) {
    return homeScore > 0 && awayScore > 0 ? ["Ja"] : ["Nein"];
  }

  if (marketType === MarketType.DOUBLE_CHANCE) {
    if (homeScore > awayScore) return ["1X", "12"];
    if (homeScore < awayScore) return ["12", "X2"];
    return ["1X", "X2"];
  }

  return [];
}

export function evaluateBetOutcome(params: {
  bet: SettlementBet;
  input: MatchSettlementInput;
  usesQualifyMethodMatrix: boolean;
  qualifyMethodWinners: string[];
}): { won: boolean; isQualifyVoid: boolean } {
  const { bet, input, usesQualifyMethodMatrix, qualifyMethodWinners } = params;
  const { homeScore, awayScore, totalCards, totalCorners } = input;

  if (bet.marketType === MarketType.TO_QUALIFY) {
    const legacyOutcome = bet.outcomeLabel === "1" || bet.outcomeLabel === "2";
    const methodOutcome = isQualifyMethodOutcome(bet.outcomeLabel);
    const qualifyingIsHome = resolveKnockoutQualifyingTeamIsHome(input);

    if (usesQualifyMethodMatrix) {
      const isQualifyVoid =
        (legacyOutcome && qualifyingIsHome === undefined) ||
        (methodOutcome && input.knockoutDecidedBy === "REGULATION");
      if (legacyOutcome) {
        return {
          isQualifyVoid,
          won:
            !isQualifyVoid &&
            ((qualifyingIsHome === true && bet.outcomeLabel === "1") ||
              (qualifyingIsHome === false && bet.outcomeLabel === "2")),
        };
      }
      if (methodOutcome) {
        return {
          isQualifyVoid,
          won: !isQualifyVoid && qualifyMethodWinners.includes(bet.outcomeLabel),
        };
      }
      return { isQualifyVoid: false, won: false };
    }
    const isQualifyVoid = qualifyingIsHome === undefined;
    return {
      isQualifyVoid,
      won:
        !isQualifyVoid &&
        ((qualifyingIsHome === true && bet.outcomeLabel === "1") ||
          (qualifyingIsHome === false && bet.outcomeLabel === "2")),
    };
  }

  if ((bet.marketType as string) === "CARDS_MATRIX") {
    return { isQualifyVoid: false, won: cardsMatrixOutcomeWins(bet.outcomeLabel, totalCards) };
  }
  if ((bet.marketType as string) === "CORNERS_MATRIX") {
    return { isQualifyVoid: false, won: cornersMatrixOutcomeWins(bet.outcomeLabel, totalCorners) };
  }
  if ((bet.marketType as string) === "GOALS_MATRIX") {
    return { isQualifyVoid: false, won: goalsMatrixOutcomeWins(bet.outcomeLabel, homeScore + awayScore) };
  }
  if ((bet.marketType as string) === "HANDICAP_MATRIX") {
    return { isQualifyVoid: false, won: handicapMatrixOutcomeWins(bet.outcomeLabel, homeScore, awayScore) };
  }

  const winners = getWinningOutcomeLabels(
    bet.marketType,
    input.homeHalfTimeScore,
    input.awayHalfTimeScore,
    homeScore,
    awayScore,
  );
  return { isQualifyVoid: false, won: winners.includes(bet.outcomeLabel) };
}

export function computeWinPayout(
  bet: SettlementBet,
  isKnockout: boolean,
  creditedByUser: Map<string, number>,
): number {
  const maxPayoutPerBet = isKnockout ? KO_MAX_PAYOUT_PER_BET : LEAGUE_MAX_PAYOUT_PER_BET;
  const maxPayoutPerMatch = isKnockout ? KO_MAX_PAYOUT_PER_MATCH : LEAGUE_MAX_PAYOUT_PER_MATCH;
  const rawReturn = Math.round(bet.stake * bet.oddsSnapshot);
  const cappedReturn = Math.min(rawReturn, maxPayoutPerBet);
  const grossPayout = payoutFromGrossReturn(cappedReturn);
  const alreadyCreditedForMatch = creditedByUser.get(bet.userId) ?? 0;
  const matchCapRemaining = Math.max(0, maxPayoutPerMatch - alreadyCreditedForMatch);
  const payout = Math.min(grossPayout, matchCapRemaining);
  if (payout > 0) {
    creditedByUser.set(bet.userId, alreadyCreditedForMatch + payout);
  }
  return payout;
}

export async function reverseMatchSettlement(
  tx: DbTx,
  match: MatchForSettlement,
): Promise<{ reversedWinnings: number; reversedBets: number }> {
  const settledBets = await tx.bet.findMany({
    where: {
      matchId: match.id,
      status: { in: [BetStatus.WON, BetStatus.LOST, BetStatus.VOID] },
    },
    orderBy: { id: "asc" },
  });

  const wonBets = settledBets.filter((bet) => bet.status === BetStatus.WON);
  const creditedByUser = new Map<string, number>();
  let reversedWinnings = 0;

  for (const bet of wonBets) {
    const payout = computeWinPayout(bet, match.isKnockout, creditedByUser);
    if (payout <= 0) {
      continue;
    }
    reversedWinnings += payout;
    const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
    const balance = wallet?.balance ?? 0;
    const debit = Math.min(balance, payout);
    if (debit > 0) {
      await tx.wallet.update({
        where: { userId: bet.userId },
        data: { balance: { decrement: debit } },
      });
    }
    await tx.pointTransaction.create({
      data: {
        userId: bet.userId,
        amount: payout,
        type: PointTransactionType.DEBIT,
        description: `Korrektur Auswertung ${match.homeTeam} vs. ${match.awayTeam} - ${bet.marketTitle}: ${bet.outcomeLabel}`,
      },
    });
  }

  await tx.bet.updateMany({
    where: { matchId: match.id, status: { not: BetStatus.OPEN } },
    data: { status: BetStatus.OPEN },
  });

  await tx.simpleTip.updateMany({
    where: { matchId: match.id, status: { not: BetStatus.OPEN } },
    data: { status: BetStatus.OPEN, payout: null },
  });

  await tx.match.update({
    where: { id: match.id },
    data: { settledAt: null },
  });

  return { reversedWinnings, reversedBets: settledBets.length };
}

export async function applyMatchSettlement(
  tx: DbTx,
  match: MatchForSettlement,
  input: MatchSettlementInput,
  usesQualifyMethodMatrix: boolean,
): Promise<number> {
  const qualifyMethodWinners: string[] =
    match.isKnockout && usesQualifyMethodMatrix && input.knockoutDecidedBy
      ? winningQualifyMethodOutcomes(
          input.knockoutDecidedBy,
          input.homeScoreAfterExtraTime,
          input.awayScoreAfterExtraTime,
          input.knockoutAdvancingIsHome,
        )
      : [];

  await tx.match.update({
    where: { id: match.id },
    data: {
      homeHalfTimeScore: input.homeHalfTimeScore,
      awayHalfTimeScore: input.awayHalfTimeScore,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      homeScoreAfterExtraTime: input.homeScoreAfterExtraTime ?? null,
      awayScoreAfterExtraTime: input.awayScoreAfterExtraTime ?? null,
      knockoutDecidedBy: input.knockoutDecidedBy ?? null,
      knockoutAdvancingIsHome: input.knockoutAdvancingIsHome ?? null,
      totalCards: input.totalCards,
      totalCorners: input.totalCorners,
      settledAt: new Date(),
    },
  });

  const openBets = await tx.bet.findMany({
    where: { matchId: match.id, status: BetStatus.OPEN },
    orderBy: { id: "asc" },
  });

  const creditedByUser = new Map<string, number>();

  for (const bet of openBets) {
    const { won, isQualifyVoid } = evaluateBetOutcome({
      bet,
      input,
      usesQualifyMethodMatrix,
      qualifyMethodWinners,
    });

    await tx.bet.update({
      where: { id: bet.id },
      data: {
        status: isQualifyVoid ? BetStatus.VOID : won ? BetStatus.WON : BetStatus.LOST,
      },
    });

    if (isQualifyVoid || !won) {
      continue;
    }

    const payout = computeWinPayout(bet, match.isKnockout, creditedByUser);
    if (payout > 0) {
      await tx.wallet.upsert({
        where: { userId: bet.userId },
        create: { userId: bet.userId, balance: payout },
        update: { balance: { increment: payout } },
      });
      await tx.pointTransaction.create({
        data: {
          userId: bet.userId,
          amount: payout,
          type: PointTransactionType.CREDIT,
          description: `Gewinn ${match.homeTeam} vs. ${match.awayTeam} - ${bet.marketTitle}: ${bet.outcomeLabel}`,
        },
      });
    }
  }

  return openBets.length;
}

export function validateKnockoutSettlement(params: {
  isKnockout: boolean;
  usesQualifyMethodMatrix: boolean;
  homeScore: number;
  awayScore: number;
  knockoutDecidedBy?: KnockoutDecidedBy;
  homeScoreAfterExtraTime?: number;
  awayScoreAfterExtraTime?: number;
  knockoutAdvancingIsHome?: boolean;
}): string | null {
  const {
    isKnockout,
    usesQualifyMethodMatrix,
    homeScore,
    awayScore,
    knockoutDecidedBy,
    homeScoreAfterExtraTime,
    awayScoreAfterExtraTime,
    knockoutAdvancingIsHome,
  } = params;

  if (!isKnockout || !usesQualifyMethodMatrix) {
    return null;
  }
  if (!knockoutDecidedBy) {
    return "Bei diesem K.-o.-Spiel ist die Auswahl zur Entscheidung (Regulärzeit / Verlängerung / Elfmeterschießen) erforderlich.";
  }
  if (knockoutDecidedBy === "REGULATION") {
    if (homeScore === awayScore) {
      return "Bei Unentschieden nach 90 Minuten kann die Entscheidung nicht „Reguläre Spielzeit“ sein.";
    }
    return null;
  }
  if (knockoutDecidedBy === "EXTRA_TIME") {
    if (homeScore !== awayScore) {
      return "Bei einem Sieger nach 90 Minuten wähle „Reguläre Spielzeit“, nicht Verlängerung.";
    }
    if (homeScoreAfterExtraTime === undefined || awayScoreAfterExtraTime === undefined) {
      return "Bitte den Endstand nach Verlängerung angeben.";
    }
    if (homeScoreAfterExtraTime === awayScoreAfterExtraTime) {
      return "Nach Verlängerung muss ein Sieger feststehen (kein Unentschieden).";
    }
    return null;
  }
  if (knockoutDecidedBy === "PENALTIES") {
    if (homeScore !== awayScore) {
      return "Elfmeterschießen ist nur bei Unentschieden nach 90 Minuten wählbar.";
    }
    if (knockoutAdvancingIsHome === undefined) {
      return "Bitte angeben, welche Mannschaft nach dem Elfmeterschießen weiterkommt.";
    }
  }
  return null;
}
