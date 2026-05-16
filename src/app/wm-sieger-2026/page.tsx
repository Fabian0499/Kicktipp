import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WmWinnerBoard } from "@/components/wm-winner-board";
import { createServerT } from "@/lib/i18n/locale";
import { WM_WINNER_EVENT_KEY } from "@/lib/wm-winner";

export const dynamic = "force-dynamic";

export default async function WmSieger2026Page() {
  const t = createServerT(await cookies());
  const currentUser = await getCurrentUser();

  const event = await db.wmWinnerEvent.findUnique({
    where: { key: WM_WINNER_EVENT_KEY },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!event) {
    return (
      <main
        className="relative flex flex-1 items-start bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto w-full max-w-4xl px-6 py-10 text-white">
          <h1 className="text-3xl font-bold">{t("wm.title")}</h1>
          <p className="mt-2 text-zinc-100">{t("wm.subtitle")}</p>
          <p className="mt-4 rounded-xl border border-white/20 bg-white/90 p-6 text-zinc-900">
            {t("wm.notConfigured")}
          </p>
        </div>
      </main>
    );
  }

  let userPick: {
    optionId: string;
    label: string;
    oddsSnapshot: number;
    stake: number;
    createdAt: string;
  } | null = null;

  if (currentUser) {
    const pick = await db.wmWinnerPick.findUnique({
      where: {
        userId_eventId: {
          userId: currentUser.id,
          eventId: event.id,
        },
      },
      include: { option: { select: { label: true } } },
    });
    if (pick) {
      userPick = {
        optionId: pick.optionId,
        label: pick.option.label,
        oddsSnapshot: pick.oddsSnapshot,
        stake: pick.stake,
        createdAt: pick.createdAt.toISOString(),
      };
    }
  }

  const [{ now }] = await db.$queryRaw<Array<{ now: Date }>>`SELECT NOW() AS now`;
  const acceptingTips = !event.settledAt && now.getTime() < event.closesAt.getTime();

  return (
    <main
      className="relative flex flex-1 items-start bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{t("wm.title")}</h1>
        <p className="mt-2 max-w-2xl text-zinc-100">{t("wm.subtitle")}</p>
        <div className="mt-8">
          <WmWinnerBoard
            initialSettledAt={event.settledAt?.toISOString() ?? null}
            initialAcceptingTips={acceptingTips}
            initialOptions={event.options.map((option) => ({
              id: option.id,
              label: option.label,
              odds: option.odds,
              isField: option.isField,
              sortOrder: option.sortOrder,
            }))}
            initialUserPick={userPick}
            isAuthenticated={Boolean(currentUser)}
          />
        </div>
      </div>
    </main>
  );
}
