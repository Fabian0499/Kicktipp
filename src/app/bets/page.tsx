import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BetsBoard } from "@/components/bets-board";
import { sortMarketOptions } from "@/lib/market-option-order";
import { createServerT } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

const marketOrder: Record<string, number> = {
  ONE_X_TWO: 10,
  TO_QUALIFY: 25,
  BOTH_TEAMS_TO_SCORE: 30,
  GOALS_MATRIX: 40,
  OVER_UNDER_1_5: 40,
  OVER_UNDER_2_5: 41,
  OVER_UNDER_3_5: 42,
  OVER_UNDER_4_5: 43,
  OVER_UNDER_5_5: 44,
  HANDICAP_MATRIX: 45,
  HALF_TIME_FULL_TIME: 51,
  CORNERS_MATRIX: 55,
  CARDS_MATRIX: 56,
  EXACT_SCORE: 999,
};

export default async function BetsPage() {
  const t = createServerT(await cookies());
  const currentUser = await getCurrentUser();
  const userMatchBudgets = currentUser
    ? await db.userMatchBudget.findMany({
        where: { userId: currentUser.id },
        select: { matchId: true, allocated: true, spent: true },
      })
    : [];
  const userSimpleTips = currentUser
    ? await db.simpleTip.findMany({
        where: {
          userId: currentUser.id,
          status: "OPEN",
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const userSimpleTipExactBets = currentUser
    ? await db.bet.findMany({
        where: {
          userId: currentUser.id,
          status: "OPEN",
          marketType: "EXACT_SCORE",
          marketTitle: "Einfach-Tipp (Exact Score)",
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const openProfiBets = currentUser
    ? await db.bet.findMany({
        where: {
          userId: currentUser.id,
          status: "OPEN",
          NOT: {
            OR: [
              { marketTitle: "Einfach-Tipp (Exact Score)" },
              { marketTitle: "Einfach-Tipp (1X2)" },
            ],
          },
        },
        select: {
          matchId: true,
          marketType: true,
          outcomeLabel: true,
        },
      })
    : [];

  const existingSimpleTipByMatch = userSimpleTips.reduce<Record<string, string>>((acc, entry) => {
    if (!acc[entry.matchId]) {
      acc[entry.matchId] = `${entry.predictedHome}:${entry.predictedAway}`;
    }
    return acc;
  }, {});
  for (const entry of userSimpleTipExactBets) {
    if (!existingSimpleTipByMatch[entry.matchId]) {
      existingSimpleTipByMatch[entry.matchId] = entry.outcomeLabel;
    }
  }
  const usedStakeByMatch = userMatchBudgets.reduce<Record<string, number>>((acc, item) => {
    acc[item.matchId] = Math.min(item.allocated, item.spent);
    return acc;
  }, {});
  const allocatedBudgetByMatch = userMatchBudgets.reduce<Record<string, number>>((acc, item) => {
    acc[item.matchId] = item.allocated;
    return acc;
  }, {});

  const openProfiBetsByMatch = openProfiBets.reduce<
    Record<string, Array<{ marketType: string; outcomeLabel: string }>>
  >((acc, bet) => {
    if (!acc[bet.matchId]) {
      acc[bet.matchId] = [];
    }
    acc[bet.matchId].push({ marketType: bet.marketType, outcomeLabel: bet.outcomeLabel });
    return acc;
  }, {});

  const matches = await db.match.findMany({
    where: {
      isPublished: true,
      settledAt: null,
    },
    include: {
      markets: {
        include: {
          options: {
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return (
    <main
      className="relative flex min-h-screen flex-1 items-start bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{t("bets.title")}</h1>
        <BetsBoard
          isAuthenticated={Boolean(currentUser)}
          currentUserId={currentUser?.id ?? null}
          existingSimpleTipByMatch={existingSimpleTipByMatch}
          openProfiBetsByMatch={openProfiBetsByMatch}
          usedStakeByMatch={usedStakeByMatch}
          allocatedBudgetByMatch={allocatedBudgetByMatch}
          matches={matches.map((match) => ({
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            groupCode: (match as unknown as { groupCode?: string | null }).groupCode ?? null,
            startsAt: match.startsAt.toISOString(),
            isKnockout: match.isKnockout,
            markets: [...match.markets]
              .sort((a, b) => {
                const orderA = marketOrder[a.type] ?? 999;
                const orderB = marketOrder[b.type] ?? 999;
                return orderA - orderB;
              })
              .map((market) => ({
                id: market.id,
                type: market.type,
                title: market.title,
                options: sortMarketOptions(market.type, market.options).map((option) => ({
                  id: option.id,
                  outcome: option.outcome,
                  odds: option.odds,
                })),
              })),
          }))}
        />
      </div>
    </main>
  );
}
