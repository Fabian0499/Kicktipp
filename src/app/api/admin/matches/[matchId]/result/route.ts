import { BetStatus, MarketType, PointTransactionType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cardsMatrixOutcomeWins } from "@/lib/cards-market";
import { cornersMatrixOutcomeWins } from "@/lib/corners-market";
import { goalsMatrixOutcomeWins } from "@/lib/goals-market";
import { handicapMatrixOutcomeWins } from "@/lib/handicap-market";
import { winningExactScoreOutcomes } from "@/lib/exact-score";
import { payoutFromGrossReturn } from "@/lib/bet-payout";
import {
  isQualifyMethodOutcome,
  qualifyMarketUsesMethodMatrix,
  winningQualifyMethodOutcomes,
  type KnockoutDecidedBy,
} from "@/lib/to-qualify-method";
import { settleMatchSchema } from "@/lib/validation";

const LEAGUE_MAX_PAYOUT_PER_BET = 400;
const LEAGUE_MAX_PAYOUT_PER_MATCH = 600;
const KO_MAX_PAYOUT_PER_BET = 600;
const KO_MAX_PAYOUT_PER_MATCH = 900;

function getResultSymbol(home: number, away: number) {
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}

function getWinningOutcomeLabels(
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

export async function POST(request: Request, context: { params: Promise<{ matchId: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }
    if (currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const { matchId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = settleMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültiges Ergebnis." }, { status: 400 });
    }

    const {
      homeHalfTimeScore,
      awayHalfTimeScore,
      homeScore,
      awayScore,
      totalCards,
      totalCorners,
      knockoutDecidedBy,
      knockoutAdvancingIsHome,
    } = parsed.data;
    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        markets: {
          where: { type: MarketType.TO_QUALIFY },
          include: {
            options: {
              select: { outcome: true },
            },
          },
        },
      },
    });
    if (!match) {
      return NextResponse.json({ error: "Spiel nicht gefunden." }, { status: 404 });
    }

    if ((match as unknown as { settledAt?: Date | null }).settledAt) {
      return NextResponse.json({ error: "Spiel wurde bereits ausgewertet." }, { status: 400 });
    }

    const qualifyOptions = match.markets[0]?.options ?? [];
    const usesQualifyMethodMatrix = qualifyMarketUsesMethodMatrix(qualifyOptions);

    if (match.isKnockout && usesQualifyMethodMatrix) {
      if (!knockoutDecidedBy) {
        return NextResponse.json(
          {
            error:
              "Bei diesem K.-o.-Spiel ist die Auswahl zur Entscheidung (Regulärzeit / Verlängerung / Elfmeterschießen) erforderlich.",
          },
          { status: 400 },
        );
      }
      if (knockoutDecidedBy === "REGULATION" && homeScore === awayScore) {
        return NextResponse.json(
          { error: "Bei Unentschieden kann die Entscheidung nicht „Reguläre Spielzeit“ sein." },
          { status: 400 },
        );
      }
      if (knockoutDecidedBy === "EXTRA_TIME" && homeScore === awayScore) {
        return NextResponse.json(
          { error: "Bei Unentschieden im Endstand kann die Entscheidung nicht „Verlängerung“ sein." },
          { status: 400 },
        );
      }
      if (knockoutDecidedBy === "PENALTIES") {
        if (homeScore !== awayScore) {
          return NextResponse.json(
            { error: "Elfmeterschießen ist nur bei unentschiedenem Endstand wählbar." },
            { status: 400 },
          );
        }
        if (knockoutAdvancingIsHome === undefined) {
          return NextResponse.json(
            { error: "Bitte angeben, welche Mannschaft nach dem Elfmeterschießen weiterkommt." },
            { status: 400 },
          );
        }
      }
    }

    const qualifyMethodWinners: string[] =
      match.isKnockout && usesQualifyMethodMatrix && knockoutDecidedBy
        ? winningQualifyMethodOutcomes(
            knockoutDecidedBy as KnockoutDecidedBy,
            homeScore,
            awayScore,
            knockoutAdvancingIsHome,
          )
        : [];

    const openBets = await db.bet.findMany({
      where: {
        matchId,
        status: BetStatus.OPEN,
      },
    });
    const maxPayoutPerBet = match.isKnockout ? KO_MAX_PAYOUT_PER_BET : LEAGUE_MAX_PAYOUT_PER_BET;
    const maxPayoutPerMatch = match.isKnockout ? KO_MAX_PAYOUT_PER_MATCH : LEAGUE_MAX_PAYOUT_PER_MATCH;

    await db.$transaction(async (tx) => {
      await (tx as unknown as { match: { update: (args: unknown) => Promise<unknown> } }).match.update({
        where: { id: matchId },
        data: {
          homeHalfTimeScore,
          awayHalfTimeScore,
          homeScore,
          awayScore,
          totalCards,
          totalCorners,
          settledAt: new Date(),
        },
      });

      const creditedByUser = new Map<string, number>();

      for (const bet of openBets) {
        let isQualifyVoid = false;
        let won: boolean;
        if (bet.marketType === MarketType.TO_QUALIFY) {
          const legacyOutcome = bet.outcomeLabel === "1" || bet.outcomeLabel === "2";
          const methodOutcome = isQualifyMethodOutcome(bet.outcomeLabel);
          if (usesQualifyMethodMatrix) {
            isQualifyVoid =
              (legacyOutcome && homeScore === awayScore) ||
              (methodOutcome && knockoutDecidedBy === "REGULATION");
            if (legacyOutcome) {
              won =
                !isQualifyVoid &&
                ((homeScore > awayScore && bet.outcomeLabel === "1") ||
                  (homeScore < awayScore && bet.outcomeLabel === "2"));
            } else if (methodOutcome) {
              won = !isQualifyVoid && qualifyMethodWinners.includes(bet.outcomeLabel);
            } else {
              won = false;
            }
          } else {
            isQualifyVoid = homeScore === awayScore;
            won =
              !isQualifyVoid &&
              ((homeScore > awayScore && bet.outcomeLabel === "1") ||
                (homeScore < awayScore && bet.outcomeLabel === "2"));
          }
        } else if ((bet.marketType as string) === "CARDS_MATRIX") {
          won = cardsMatrixOutcomeWins(bet.outcomeLabel, totalCards);
        } else if ((bet.marketType as string) === "CORNERS_MATRIX") {
          won = cornersMatrixOutcomeWins(bet.outcomeLabel, totalCorners);
        } else if ((bet.marketType as string) === "GOALS_MATRIX") {
          won = goalsMatrixOutcomeWins(bet.outcomeLabel, homeScore + awayScore);
        } else if ((bet.marketType as string) === "HANDICAP_MATRIX") {
          won = handicapMatrixOutcomeWins(bet.outcomeLabel, homeScore, awayScore);
        } else {
          const winners = getWinningOutcomeLabels(
            bet.marketType,
            homeHalfTimeScore,
            awayHalfTimeScore,
            homeScore,
            awayScore,
          );
          won = winners.includes(bet.outcomeLabel);
        }

        await (tx as unknown as { bet: { update: (args: unknown) => Promise<unknown> } }).bet.update({
          where: { id: bet.id },
          data: {
            status: isQualifyVoid ? BetStatus.VOID : won ? BetStatus.WON : BetStatus.LOST,
          },
        });

        if (isQualifyVoid || !won) {
          continue;
        }

        const rawReturn = Math.round(bet.stake * bet.oddsSnapshot);
        const cappedReturn = Math.min(rawReturn, maxPayoutPerBet);
        const grossPayout = payoutFromGrossReturn(cappedReturn);
        const alreadyCreditedForMatch = creditedByUser.get(bet.userId) ?? 0;
        const matchCapRemaining = Math.max(0, maxPayoutPerMatch - alreadyCreditedForMatch);
        const payout = Math.min(grossPayout, matchCapRemaining);

        if (payout > 0) {
          await tx.wallet.upsert({
            where: { userId: bet.userId },
            create: {
              userId: bet.userId,
              balance: payout,
            },
            update: {
              balance: { increment: payout },
            },
          });
          await tx.pointTransaction.create({
            data: {
              userId: bet.userId,
              amount: payout,
              type: PointTransactionType.CREDIT,
              description: `Gewinn ${match.homeTeam} vs. ${match.awayTeam} - ${bet.marketTitle}: ${bet.outcomeLabel}`,
            },
          });
          creditedByUser.set(bet.userId, alreadyCreditedForMatch + payout);
        }
      }

    });

    return NextResponse.json({ ok: true, settledCount: openBets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler bei der Auswertung.";
    return NextResponse.json({ error: `Auswertung fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
