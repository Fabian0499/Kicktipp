import { BetStatus, PointTransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { exactScoreOutcomeForPrediction } from "@/lib/exact-score";
import { MIN_BETTABLE_ODDS, oddsViolateMinimumForMarket } from "@/lib/min-bettable-odds";
import { placeSimpleTipSchema } from "@/lib/validation";

const DEFAULT_MATCH_BET_BUDGET = 100;

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Bitte zuerst einloggen." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = placeSimpleTipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const { matchId, predictedHome, predictedAway } = parsed.data;

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || !match.isPublished || match.settledAt) {
    return NextResponse.json({ error: "Spiel ist nicht verfügbar." }, { status: 400 });
  }

  const oneXTwoStake = match.isKnockout ? 140 : 80;
  const exactScoreStake = match.isKnockout ? 60 : 20;
  const totalStake = oneXTwoStake + exactScoreStake;

  const defaultBudget = match.isKnockout ? 200 : DEFAULT_MATCH_BET_BUDGET;
  const budget = await db.userMatchBudget.findUnique({
    where: {
      userId_matchId: {
        userId: currentUser.id,
        matchId,
      },
    },
  });
  const spent = budget?.spent ?? 0;
  const allocated = budget?.allocated ?? defaultBudget;
  if (spent + totalStake > allocated) {
    return NextResponse.json(
      { error: `Für dieses Spiel stehen dir insgesamt nur ${allocated} Einsatzpunkte zur Verfügung.` },
      { status: 400 },
    );
  }

  const oneXTwoMarket = await db.matchMarket.findFirst({
    where: { matchId, type: "ONE_X_TWO" },
    include: { options: true },
  });
  const exactScoreMarket = await db.matchMarket.findFirst({
    where: { matchId, type: "EXACT_SCORE" },
    include: { options: true },
  });

  if (!oneXTwoMarket || !exactScoreMarket) {
    return NextResponse.json(
      { error: "Für dieses Spiel fehlen erforderliche Märkte (1X2 oder Exact Score)." },
      { status: 400 },
    );
  }

  const tendencyOutcome = predictedHome > predictedAway ? "1" : predictedHome < predictedAway ? "2" : "X";
  const exactOutcomeLabel = exactScoreOutcomeForPrediction(predictedHome, predictedAway);

  const oneXTwoOption = oneXTwoMarket.options.find((option) => option.outcome === tendencyOutcome);
  const exactScoreOption = exactScoreMarket.options.find((option) => option.outcome === exactOutcomeLabel);
  if (!oneXTwoOption || !exactScoreOption) {
    return NextResponse.json({ error: "Passende Quotenoption wurde nicht gefunden." }, { status: 400 });
  }
  if (oddsViolateMinimumForMarket("EXACT_SCORE", exactScoreOption.odds)) {
    return NextResponse.json(
      {
        error: `Einfach-Tipp nicht möglich: die Exact-Score-Quote muss über ${MIN_BETTABLE_ODDS.toFixed(2)} liegen.`,
      },
      { status: 400 },
    );
  }

  const existingSimpleTip = await db.bet.findFirst({
    where: {
      userId: currentUser.id,
      matchId,
      status: BetStatus.OPEN,
      OR: [{ marketTitle: "Einfach-Tipp (1X2)" }, { marketTitle: "Einfach-Tipp (Exact Score)" }],
    },
  });
  if (existingSimpleTip) {
    return NextResponse.json(
      { error: "Für dieses Spiel wurde bereits ein Einfach-Tipp abgegeben." },
      { status: 400 },
    );
  }

  await db.$transaction(async (tx) => {
    await (tx as unknown as { bet: { create: (args: unknown) => Promise<unknown> } }).bet.create({
      data: {
        userId: currentUser.id,
        matchId,
        marketOptionId: oneXTwoOption.id,
        marketType: oneXTwoMarket.type,
        marketTitle: `Einfach-Tipp (1X2)`,
        outcomeLabel: oneXTwoOption.outcome,
        stake: oneXTwoStake,
        oddsSnapshot: oneXTwoOption.odds,
      },
    });

    await (tx as unknown as { bet: { create: (args: unknown) => Promise<unknown> } }).bet.create({
      data: {
        userId: currentUser.id,
        matchId,
        marketOptionId: exactScoreOption.id,
        marketType: exactScoreMarket.type,
        marketTitle: `Einfach-Tipp (Exact Score)`,
        outcomeLabel: exactScoreOption.outcome,
        stake: exactScoreStake,
        oddsSnapshot: exactScoreOption.odds,
      },
    });

    await tx.userMatchBudget.upsert({
      where: {
        userId_matchId: {
          userId: currentUser.id,
          matchId,
        },
      },
      create: {
        userId: currentUser.id,
        matchId,
        allocated: defaultBudget,
        spent: totalStake,
      },
      update: {
        spent: { increment: totalStake },
      },
    });
    await tx.pointTransaction.create({
      data: {
        userId: currentUser.id,
        amount: totalStake,
        type: PointTransactionType.DEBIT,
        description: `Spielbudget eingesetzt: ${match.homeTeam} vs. ${match.awayTeam} - Einfach-Tipp ${predictedHome}:${predictedAway} (1X2 @ ${oneXTwoOption.odds.toFixed(2)}, Exact @ ${exactScoreOption.odds.toFixed(2)})`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
