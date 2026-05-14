import { MarketType, PointTransactionType, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminCreateMatchSchema } from "@/lib/validation";
import { EXACT_SCORE_ORDERED_OUTCOMES } from "@/lib/exact-score";
import { inferWorldCupGroupCode } from "@/lib/world-cup-groups";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  if (currentUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminCreateMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const { homeTeam, awayTeam, groupCode, startsAt, isKnockout, odds } = parsed.data;
  const allocatedBudget = isKnockout ? 200 : 100;
  const resolvedGroupCode = groupCode ?? inferWorldCupGroupCode(homeTeam, awayTeam);

  const createdMatch = await db.$transaction(async (tx) => {
    const baseMatchData = {
      homeTeam,
      awayTeam,
      startsAt: new Date(startsAt),
      isKnockout,
      isPublished: true,
      createdById: currentUser.id,
      cardsMatrixStart: odds.cardsMatrixStart,
      cardsMatrixRowCount: odds.cardsMatrixRowCount,
      cornersMatrixStart: odds.cornersMatrixStart,
      cornersMatrixRowCount: odds.cornersMatrixRowCount,
    };
    let match: { id: string; homeTeam: string; awayTeam: string; isKnockout: boolean };
    try {
      match = await tx.match.create({
        data: {
          ...baseMatchData,
          ...(resolvedGroupCode ? { groupCode: resolvedGroupCode } : {}),
        } as Parameters<(typeof tx.match)["create"]>[0]["data"],
      });
    } catch (error) {
      const isUnknownGroupCodeArgument =
        error instanceof Prisma.PrismaClientValidationError &&
        error.message.includes("Unknown argument `groupCode`");

      if (!isUnknownGroupCodeArgument) {
        throw error;
      }

      // Fallback for environments where Prisma Client/DB migration lag behind.
      match = await tx.match.create({
        data: baseMatchData as Parameters<(typeof tx.match)["create"]>[0]["data"],
      });
    }

    async function createMarket(type: MarketType, title: string, options: Array<{ outcome: string; odds: number }>) {
      const market = await tx.matchMarket.create({
        data: {
          matchId: match.id,
          type,
          title,
        },
      });

      await tx.marketOption.createMany({
        data: options.map((item) => ({
          marketId: market.id,
          outcome: item.outcome,
          odds: item.odds,
        })),
      });
    }

    await createMarket(MarketType.ONE_X_TWO, "1X2", [
      { outcome: "1", odds: odds.oneXTwo.home },
      { outcome: "X", odds: odds.oneXTwo.draw },
      { outcome: "2", odds: odds.oneXTwo.away },
    ]);

    await createMarket("HALF_TIME_FULL_TIME" as MarketType, "Halbzeit / Endstand", [
      { outcome: "1/1", odds: odds.halfTimeFullTime.oneOne },
      { outcome: "1/X", odds: odds.halfTimeFullTime.oneX },
      { outcome: "1/2", odds: odds.halfTimeFullTime.oneTwo },
      { outcome: "X/1", odds: odds.halfTimeFullTime.xOne },
      { outcome: "X/X", odds: odds.halfTimeFullTime.xX },
      { outcome: "X/2", odds: odds.halfTimeFullTime.xTwo },
      { outcome: "2/1", odds: odds.halfTimeFullTime.twoOne },
      { outcome: "2/X", odds: odds.halfTimeFullTime.twoX },
      { outcome: "2/2", odds: odds.halfTimeFullTime.twoTwo },
    ]);

    await createMarket(
      "EXACT_SCORE" as MarketType,
      "Exact Score",
      (() => {
        const es = odds.exactScore as Record<string, number>;
        return EXACT_SCORE_ORDERED_OUTCOMES.map((outcome) => ({
          outcome,
          odds: es[outcome],
        }));
      })(),
    );

    const goalOptions: Array<{ outcome: string; odds: number }> = [];
    const gStart = odds.goalsMatrixStart;
    const gCount = odds.goalsMatrixRowCount;
    for (let i = 0; i < gCount; i += 1) {
      const n = gStart + i;
      const row = odds.goalsMatrix[i];
      goalOptions.push(
        { outcome: `GOALS:U:${n}`, odds: row.unter },
        { outcome: `GOALS:E:${n}`, odds: row.exakt },
        { outcome: `GOALS:O:${n}`, odds: row.uber },
      );
    }
    await createMarket("GOALS_MATRIX" as MarketType, "Über / Unter Tore", goalOptions);

    await createMarket(MarketType.BOTH_TEAMS_TO_SCORE, "Beide Teams treffen", [
      { outcome: "Ja", odds: odds.bothTeamsToScore.yes },
      { outcome: "Nein", odds: odds.bothTeamsToScore.no },
    ]);

    const handicapOptions: Array<{ outcome: string; odds: number }> = [];
    for (const row of odds.handicapMatrix) {
      handicapOptions.push(
        { outcome: `HANDICAP:${row.homeHandicap}:${row.awayHandicap}:1`, odds: row.home },
        { outcome: `HANDICAP:${row.homeHandicap}:${row.awayHandicap}:X`, odds: row.draw },
        { outcome: `HANDICAP:${row.homeHandicap}:${row.awayHandicap}:2`, odds: row.away },
      );
    }
    await createMarket("HANDICAP_MATRIX" as MarketType, "Handicap", handicapOptions);

    const cardOptions: Array<{ outcome: string; odds: number }> = [];
    const kStart = odds.cardsMatrixStart;
    const kCount = odds.cardsMatrixRowCount;
    for (let i = 0; i < kCount; i += 1) {
      const n = kStart + i;
      const row = odds.cardsMatrix[i];
      if (n === 0) {
        cardOptions.push(
          { outcome: `CARDS:E:${n}`, odds: row.exakt },
          { outcome: `CARDS:O:${n}`, odds: row.uber },
        );
      } else {
        cardOptions.push(
          { outcome: `CARDS:U:${n}`, odds: row.unter! },
          { outcome: `CARDS:E:${n}`, odds: row.exakt },
          { outcome: `CARDS:O:${n}`, odds: row.uber },
        );
      }
    }
    await createMarket("CARDS_MATRIX" as MarketType, "Kort", cardOptions);

    const cornerOptions: Array<{ outcome: string; odds: number }> = [];
    const cStart = odds.cornersMatrixStart;
    const cCount = odds.cornersMatrixRowCount;
    for (let i = 0; i < cCount; i += 1) {
      const n = cStart + i;
      const row = odds.cornersMatrix[i];
      if (n === 0) {
        cornerOptions.push(
          { outcome: `CORNERS:E:${n}`, odds: row.exakt },
          { outcome: `CORNERS:O:${n}`, odds: row.uber },
        );
      } else {
        cornerOptions.push(
          { outcome: `CORNERS:U:${n}`, odds: row.unter! },
          { outcome: `CORNERS:E:${n}`, odds: row.exakt },
          { outcome: `CORNERS:O:${n}`, odds: row.uber },
        );
      }
    }
    await createMarket("CORNERS_MATRIX" as MarketType, "Hjornespark", cornerOptions);

    if (isKnockout && odds.toQualify) {
      await createMarket(MarketType.TO_QUALIFY, "Methode des Sieges", [
        { outcome: "QUALIFY:ET:1", odds: odds.toQualify.homeEt },
        { outcome: "QUALIFY:ET:2", odds: odds.toQualify.awayEt },
        { outcome: "QUALIFY:PEN:1", odds: odds.toQualify.homePen },
        { outcome: "QUALIFY:PEN:2", odds: odds.toQualify.awayPen },
      ]);
    }

    const users = await tx.user.findMany({
      where: {
        status: { not: "BLOCKED" },
      },
      select: { id: true },
    });

    if (users.length > 0) {
      await tx.userMatchBudget.createMany({
        data: users.map((user) => ({
          userId: user.id,
          matchId: match.id,
          allocated: allocatedBudget,
          spent: 0,
        })),
        skipDuplicates: true,
      });

      await tx.pointTransaction.createMany({
        data: users.map((user) => ({
          userId: user.id,
          amount: allocatedBudget,
          type: PointTransactionType.CREDIT,
          description: `Spielbudget freigegeben (${isKnockout ? "KO" : "Liga"}): ${match.homeTeam} vs. ${match.awayTeam}`,
        })),
      });
    }

    return match;
  });

  return NextResponse.json({ ok: true, matchId: createdMatch.id });
}
