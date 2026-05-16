import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload";
import { DashboardSections } from "@/components/dashboard-sections";
import { leaderboardRankFromRows } from "@/lib/leaderboard-rank";
import { createServerT } from "@/lib/i18n/locale";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const t = createServerT(await cookies());
  if (!user) {
    redirect("/login");
  }

  const transactions = await db.pointTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  const openBets = await db.bet.findMany({
    where: {
      userId: user.id,
      status: "OPEN",
    },
    include: {
      match: {
        select: {
          homeTeam: true,
          awayTeam: true,
          startsAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const closedBets = await db.bet.findMany({
    where: {
      userId: user.id,
      status: { in: ["WON", "LOST", "VOID"] },
    },
    include: {
      match: {
        select: {
          homeTeam: true,
          awayTeam: true,
          startsAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const budgetRows = await db.userMatchBudget.findMany({
    where: {
      userId: user.id,
      match: {
        isPublished: true,
        settledAt: null,
      },
    },
    include: {
      match: {
        select: {
          homeTeam: true,
          awayTeam: true,
          startsAt: true,
        },
      },
    },
    orderBy: {
      match: {
        startsAt: "asc",
      },
    },
  });
  const walletTransactions = transactions.filter((entry) => !entry.description.startsWith("Spielbudget"));

  const leaderboardPlacement = user.hiddenFromLeaderboard
    ? null
    : leaderboardRankFromRows(
        (
          await db.user.findMany({
            where: { hiddenFromLeaderboard: false },
            include: { wallet: true },
          })
        ).map((entry) => ({
          id: entry.id,
          points: entry.wallet?.balance ?? 0,
        })),
        user.id,
      );

  return (
    <main
      className="relative flex min-h-screen flex-1 items-start bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("dashboard.title")}</h1>
          <p className="text-white">
            {t("dashboard.greeting").replace("{name}", user.username ?? user.email)}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <ProfileAvatarUpload name={user.username ?? user.email} avatarUrl={user.avatarUrl ?? null} />
        <article className="flex min-h-[9.5rem] flex-col rounded-xl border bg-white p-5 text-zinc-900 shadow-sm">
          {leaderboardPlacement ? (
            <p className="text-center text-base font-semibold text-black">
              {t("dashboard.placement")}: {leaderboardPlacement.rank}
            </p>
          ) : null}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-3xl font-semibold">
              {user.wallet?.balance ?? 0} {t("common.points")}
            </p>
          </div>
        </article>
      </section>

      <DashboardSections
        openBets={openBets.map((bet) => ({
          id: bet.id,
          homeTeam: bet.match.homeTeam,
          awayTeam: bet.match.awayTeam,
          startsAt: bet.match.startsAt.toISOString(),
          marketTitle: bet.marketTitle,
          marketType: bet.marketType,
          outcomeLabel: bet.outcomeLabel,
          oddsSnapshot: bet.oddsSnapshot,
          stake: bet.stake,
          status: bet.status,
        }))}
        closedBets={closedBets.map((bet) => ({
          id: bet.id,
          homeTeam: bet.match.homeTeam,
          awayTeam: bet.match.awayTeam,
          startsAt: bet.match.startsAt.toISOString(),
          marketTitle: bet.marketTitle,
          marketType: bet.marketType,
          outcomeLabel: bet.outcomeLabel,
          oddsSnapshot: bet.oddsSnapshot,
          stake: bet.stake,
          status: bet.status,
        }))}
        budgetRows={budgetRows.map((row) => ({
          id: row.id,
          homeTeam: row.match.homeTeam,
          awayTeam: row.match.awayTeam,
          allocated: row.allocated,
          spent: row.spent,
        }))}
        walletTransactions={walletTransactions.map((entry) => ({
          id: entry.id,
          description: entry.description,
          amount: entry.amount,
          type: entry.type,
        }))}
      />
      </div>
    </main>
  );
}
