import { NextResponse } from "next/server";
import { PointTransactionType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiBetConflictsOpenSet } from "@/lib/betting-conflicts";
import { profiMarketCategoryKey } from "@/lib/profi-market-category";
import { MIN_BETTABLE_ODDS, oddsViolateMinimumForMarket } from "@/lib/min-bettable-odds";
import { isMatchOpenForBetting, MATCH_TIPS_CLOSED_MESSAGE } from "@/lib/match-betting";
import { placeBetSchema } from "@/lib/validation";

const DEFAULT_MATCH_BET_BUDGET = 100;

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Bitte zuerst einloggen." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = placeBetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Einsatz." }, { status: 400 });
  }

  const { selections, stake } = parsed.data;
  const uniqueSelections = Array.from(
    new Map(selections.map((selection) => [selection.marketOptionId, selection])).values(),
  );
  if (uniqueSelections.length !== 1) {
    return NextResponse.json(
      { error: "Es sind nur Einzelwetten erlaubt. Bitte genau eine Auswahl platzieren." },
      { status: 400 },
    );
  }
  const uniqueMatchIds = new Set(uniqueSelections.map((selection) => selection.matchId));
  if (uniqueMatchIds.size !== uniqueSelections.length) {
    return NextResponse.json(
      { error: "In einer Kombination ist pro Spiel nur eine Wette erlaubt." },
      { status: 400 },
    );
  }

  const optionIds = uniqueSelections.map((selection) => selection.marketOptionId);
  const marketOptions = await db.marketOption.findMany({
    where: {
      id: { in: optionIds },
    },
    include: {
      market: {
        include: {
          match: true,
        },
      },
    },
  });

  if (marketOptions.length !== uniqueSelections.length) {
    return NextResponse.json({ error: "Eine oder mehrere Wettoptionen wurden nicht gefunden." }, { status: 404 });
  }

  const optionById = new Map(marketOptions.map((option) => [option.id, option]));

  for (const selection of uniqueSelections) {
    const option = optionById.get(selection.marketOptionId);
    if (!option || option.market.matchId !== selection.matchId) {
      return NextResponse.json({ error: "Wettoption passt nicht zum Spiel." }, { status: 400 });
    }

    if (!option.market.match.isPublished) {
      return NextResponse.json({ error: "Mindestens ein Spiel ist nicht verfügbar." }, { status: 400 });
    }
    if (!isMatchOpenForBetting(option.market.match)) {
      return NextResponse.json({ error: MATCH_TIPS_CLOSED_MESSAGE }, { status: 400 });
    }
    if (oddsViolateMinimumForMarket(option.market.type, option.odds)) {
      return NextResponse.json(
        { error: `Quoten von ${MIN_BETTABLE_ODDS.toFixed(2)} oder weniger sind gesperrt (außer 1X2).` },
        { status: 400 },
      );
    }
  }

  const distinctMatchIds = Array.from(uniqueMatchIds);
  const existingOpenBets = await db.bet.findMany({
    where: {
      userId: currentUser.id,
      status: "OPEN",
      matchId: { in: distinctMatchIds },
      NOT: {
        OR: [{ marketTitle: "Einfach-Tipp (Exact Score)" }, { marketTitle: "Einfach-Tipp (1X2)" }],
      },
    },
    select: {
      matchId: true,
      marketType: true,
      outcomeLabel: true,
    },
  });

  const openByMatch = new Map<string, Array<{ marketType: (typeof existingOpenBets)[number]["marketType"]; outcomeLabel: string }>>();
  for (const bet of existingOpenBets) {
    const list = openByMatch.get(bet.matchId) ?? [];
    list.push({ marketType: bet.marketType, outcomeLabel: bet.outcomeLabel });
    openByMatch.set(bet.matchId, list);
  }

  for (const selection of uniqueSelections) {
    const option = optionById.get(selection.marketOptionId);
    if (!option) {
      continue;
    }
    const openForMatch = openByMatch.get(selection.matchId) ?? [];
    const newCategory = profiMarketCategoryKey(option.market.type);
    if (openForMatch.some((entry) => profiMarketCategoryKey(entry.marketType) === newCategory)) {
      return NextResponse.json(
        {
          error:
            "Für dieses Spiel hast du bereits einen offenen Tipp in dieser Wett-Kategorie (z. B. zählen alle Über-/Unter-Tore als eine Kategorie). Pro Spiel ist nur ein offener Tipp pro Kategorie erlaubt.",
        },
        { status: 400 },
      );
    }
    if (
      profiBetConflictsOpenSet(
        { marketType: option.market.type, outcomeLabel: option.outcome },
        openForMatch.map((entry) => ({ marketType: entry.marketType, outcomeLabel: entry.outcomeLabel })),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Diese Wette ist nicht möglich: Mit deinen bereits offenen Tipps in diesem Spiel würdest du alle Ausgänge abdecken (Absicherung).",
        },
        { status: 400 },
      );
    }
  }

  for (const matchId of distinctMatchIds) {
    const option = marketOptions.find((entry) => entry.market.matchId === matchId);
    const defaultBudget = option?.market.match.isKnockout ? 200 : DEFAULT_MATCH_BET_BUDGET;
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
    if (spent + stake > allocated) {
      return NextResponse.json(
        { error: `Für dieses Spiel stehen dir insgesamt nur ${allocated} Einsatzpunkte zur Verfügung.` },
        { status: 400 },
      );
    }
  }

  const combinedOdds = marketOptions.reduce((acc, option) => acc * option.odds, 1);

  await db.$transaction(async (tx) => {
    for (const selection of uniqueSelections) {
      const option = optionById.get(selection.marketOptionId);
      if (!option) {
        continue;
      }

      await (tx as unknown as { bet: { create: (args: unknown) => Promise<unknown> } }).bet.create({
        data: {
          userId: currentUser.id,
          matchId: selection.matchId,
          marketOptionId: selection.marketOptionId,
          marketType: option.market.type,
          marketTitle: uniqueSelections.length > 1 ? `Kombi (${option.market.title})` : option.market.title,
          outcomeLabel: option.outcome,
          stake,
          oddsSnapshot: uniqueSelections.length > 1 ? combinedOdds : option.odds,
        },
      });

      const matchLabel = `${option.market.match.homeTeam} vs. ${option.market.match.awayTeam}`;
      await tx.userMatchBudget.upsert({
        where: {
          userId_matchId: {
            userId: currentUser.id,
            matchId: selection.matchId,
          },
        },
        create: {
          userId: currentUser.id,
          matchId: selection.matchId,
          allocated: option.market.match.isKnockout ? 200 : DEFAULT_MATCH_BET_BUDGET,
          spent: stake,
        },
        update: {
          spent: { increment: stake },
        },
      });
      await tx.pointTransaction.create({
        data: {
          userId: currentUser.id,
          amount: stake,
          type: PointTransactionType.DEBIT,
          description: `Spielbudget eingesetzt: ${matchLabel} - ${option.market.title} (${option.outcome}) @ ${option.odds.toFixed(2)}`,
        },
      });
    }
  });

  return NextResponse.json({ ok: true, combinedOdds });
}
