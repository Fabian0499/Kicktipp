import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminWmWinner } from "@/components/admin-wm-winner";
import { AdminMatchForm } from "@/components/admin-match-form";
import { AdminMatchOddsEditor } from "@/components/admin-match-odds-editor";
import { AdminPointsAdjustment } from "@/components/admin-points-adjustment";
import { AdminResultSettlementSection } from "@/components/admin-result-settlement-section";
import { AdminLeaderboardVisibility } from "@/components/admin-leaderboard-visibility";
import { AdminUserApprovals } from "@/components/admin-user-approvals";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sortMarketOptions } from "@/lib/market-option-order";
import { qualifyMarketUsesMethodMatrix } from "@/lib/to-qualify-method";
import { WM_WINNER_EVENT_KEY } from "@/lib/wm-winner";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const matches = await db.match.findMany({
    include: {
      markets: {
        include: {
          options: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { startsAt: "desc" },
  });
  const users = await db.user.findMany({
    include: { wallet: true },
    orderBy: { createdAt: "desc" },
  });
  const pendingUsers = await db.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  const wmEvent = await db.wmWinnerEvent.findUnique({
    where: { key: WM_WINNER_EVENT_KEY },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <main
      className="relative flex min-h-screen flex-1 items-start overflow-x-hidden bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full min-w-0 max-w-5xl overflow-x-hidden px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Verwaltung</h1>
      <p className="mt-2 text-white">
        Hier legst du Spiele an und hinterlegst Quoten für die wichtigsten Wettmärkte.
      </p>
      <AdminMatchForm />
      <AdminMatchOddsEditor
        matches={matches
          .filter((match) => !((match as unknown as { settledAt?: Date | null }).settledAt ?? null))
          .map((match) => ({
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            startsAt: match.startsAt.toISOString(),
            settledAt: null,
            cardsMatrixStart: match.cardsMatrixStart,
            cardsMatrixRowCount: match.cardsMatrixRowCount,
            cornersMatrixStart: match.cornersMatrixStart,
            cornersMatrixRowCount: match.cornersMatrixRowCount,
            markets: match.markets.map((market) => ({
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
      <AdminResultSettlementSection
        matches={matches.map((match) => {
          const qualifyMarket = match.markets.find((m) => m.type === "TO_QUALIFY");
          const usesQualifyMethodMatrix = qualifyMarket
            ? qualifyMarketUsesMethodMatrix(
                sortMarketOptions(qualifyMarket.type, qualifyMarket.options).map((o) => ({ outcome: o.outcome })),
              )
            : false;
          return {
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            startsAt: match.startsAt.toISOString(),
            isKnockout: match.isKnockout,
            usesQualifyMethodMatrix,
            homeHalfTimeScore:
              (match as unknown as { homeHalfTimeScore?: number | null }).homeHalfTimeScore ?? null,
            awayHalfTimeScore:
              (match as unknown as { awayHalfTimeScore?: number | null }).awayHalfTimeScore ?? null,
            homeScore: (match as unknown as { homeScore?: number | null }).homeScore ?? null,
            awayScore: (match as unknown as { awayScore?: number | null }).awayScore ?? null,
            settledAt:
              (match as unknown as { settledAt?: Date | null }).settledAt?.toISOString() ?? null,
            totalCards: (match as unknown as { totalCards?: number | null }).totalCards ?? null,
            totalCorners: (match as unknown as { totalCorners?: number | null }).totalCorners ?? null,
          };
        })}
      />
      <AdminUserApprovals
        users={pendingUsers.map((entry) => ({
          id: entry.id,
          username: entry.username ?? entry.email,
          email: entry.email,
          createdAt: entry.createdAt.toISOString(),
        }))}
      />
      <AdminPointsAdjustment
        users={users.map((entry) => ({
          id: entry.id,
          label: `${entry.username ?? entry.email} - ${entry.email}`,
          balance: entry.wallet?.balance ?? 0,
        }))}
      />
      <AdminLeaderboardVisibility
        users={users.map((entry) => ({
          id: entry.id,
          label: `${entry.username ?? entry.email} - ${entry.email}`,
          hiddenFromLeaderboard: entry.hiddenFromLeaderboard,
        }))}
      />
      {wmEvent ? (
        <AdminWmWinner
          closesAtIso={wmEvent.closesAt.toISOString()}
          settledAtIso={wmEvent.settledAt?.toISOString() ?? null}
          winnerOptionId={wmEvent.winnerOptionId}
          options={wmEvent.options.map((option) => ({
            id: option.id,
            label: option.label,
            odds: option.odds,
            isField: option.isField,
            sortOrder: option.sortOrder,
          }))}
        />
      ) : (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          WM-Wette: Es wurde kein Event mit dem Schlüssel <code className="rounded bg-amber-100 px-1">WM_2026</code>{" "}
          gefunden (Tabellen fehlen oder der Eintrag wurde gelöscht). Bitte im Projektordner{" "}
          <code className="rounded bg-amber-100 px-1">npx prisma migrate deploy</code> ausführen. Danach
          erscheint &quot;WM Sieger 2026&quot; wieder – Quoten kannst du im Formular anpassen.
        </p>
      )}
      </div>
    </main>
  );
}
