import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload";
import { DashboardSections } from "@/components/dashboard-sections";

export default async function DashboardPage() {
  const user = await getCurrentUser();
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
  const openMatchBudget = budgetRows.reduce((sum, row) => sum + Math.max(0, row.allocated - row.spent), 0);
  const budgetTransactions = transactions.filter((entry) => entry.description.startsWith("Spielbudget"));
  const walletTransactions = transactions.filter((entry) => !entry.description.startsWith("Spielbudget"));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dein Dashboard</h1>
          <p className="text-white">Hallo {user.username ?? user.name}, hier findest du deinen aktuellen Stand.</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <ProfileAvatarUpload name={user.username ?? user.name} avatarUrl={user.avatarUrl ?? null} />
        <article className="rounded-xl border bg-white p-5 text-zinc-900 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-600">Punktekonto (Gewinne)</h2>
          <p className="mt-2 text-3xl font-semibold">{user.wallet?.balance ?? 0} Punkte</p>
        </article>
        <article className="rounded-xl border bg-white p-5 text-zinc-900 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-600">Spielbudget (ungenutzt)</h2>
          <p className="mt-2 text-3xl font-semibold">{openMatchBudget} Punkte</p>
          <p className="mt-1 text-sm text-zinc-500">Nur für aktuell offene Spiele nutzbar.</p>
        </article>
      </section>

      <DashboardSections
        openBets={openBets.map((bet) => ({
          id: bet.id,
          homeTeam: bet.match.homeTeam,
          awayTeam: bet.match.awayTeam,
          startsAt: bet.match.startsAt.toISOString(),
          marketTitle: bet.marketTitle,
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
        budgetTransactions={budgetTransactions.map((entry) => ({
          id: entry.id,
          description: entry.description,
          amount: entry.amount,
          type: entry.type,
        }))}
      />
    </main>
  );
}
