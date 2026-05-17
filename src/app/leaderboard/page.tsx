import { cookies } from "next/headers";
import { db } from "@/lib/db";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { createServerT } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

function leaderboardDisplayLabel(username: string | null, email: string): string {
  return username?.trim() || email;
}

export default async function LeaderboardPage() {
  const t = createServerT(await cookies());
  const currentUser = await getCurrentUser();
  const users = await db.user.findMany({
    where: { hiddenFromLeaderboard: false },
    include: {
      wallet: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const ranking = users
    .map((user) => ({
      id: user.id,
      displayName: leaderboardDisplayLabel(user.username, user.email),
      points: user.wallet?.balance ?? 0,
      avatarUrl: user.avatarUrl,
    }))
    .sort((a, b) => b.points - a.points);
  const rankIndex = currentUser ? ranking.findIndex((entry) => entry.id === currentUser.id) : -1;
  const currentUserRank = rankIndex >= 0 ? rankIndex + 1 : null;
  const isHiddenFromLeaderboard = currentUser?.hiddenFromLeaderboard === true;

  return (
    <main
      className="relative flex flex-1 items-start bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">{t("leaderboard.title")}</h1>
          <p className="rounded-md border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
            {t("leaderboard.rankLabel")}:{" "}
            {isHiddenFromLeaderboard ? t("leaderboard.rankHidden") : (currentUserRank ?? "-")}
          </p>
        </div>
        {isHiddenFromLeaderboard ? (
          <p className="mt-2 rounded-md border border-amber-300/60 bg-amber-500/20 px-3 py-2 text-sm text-amber-50">
            {t("leaderboard.hiddenNotice")}
          </p>
        ) : null}

        <section className="mt-4 rounded-xl border bg-white p-3 text-zinc-900 shadow-sm">
          {ranking.length === 0 ? (
            <p className="p-2 text-sm text-zinc-600">{t("leaderboard.empty")}</p>
          ) : (
            <ol className="space-y-2">
              {ranking.map((entry, index) => (
                <li
                  key={entry.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    index === 0
                      ? "border-amber-500 bg-amber-200"
                      : index === 1
                        ? "border-zinc-400 bg-zinc-200"
                        : index === 2
                          ? "border-orange-500 bg-orange-200"
                          : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={`w-8 shrink-0 text-center text-sm font-semibold ${
                        index === 0
                          ? "text-amber-900"
                          : index === 1
                            ? "text-zinc-800"
                            : index === 2
                              ? "text-orange-900"
                              : "text-zinc-600"
                      }`}
                    >
                      {index + 1}.
                    </span>
                    {entry.avatarUrl ? (
                      <Image
                        src={entry.avatarUrl}
                        alt={`${t("leaderboard.profileAlt")} ${entry.displayName}`}
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] shrink-0 rounded-full border object-cover"
                      />
                    ) : (
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border bg-zinc-100 text-lg text-zinc-600">
                        {entry.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="min-w-0 break-words text-base font-medium">{entry.displayName}</span>
                  </div>
                  <span className="shrink-0 text-lg font-semibold">
                    {entry.points} {t("common.points")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
