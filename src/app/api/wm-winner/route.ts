import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WM_WINNER_EVENT_KEY } from "@/lib/wm-winner";

export const dynamic = "force-dynamic";

export async function GET() {
  const event = await db.wmWinnerEvent.findUnique({
    where: { key: WM_WINNER_EVENT_KEY },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          sortOrder: true,
          odds: true,
          isField: true,
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "WM-Wette ist noch nicht eingerichtet." }, { status: 404 });
  }

  const currentUser = await getCurrentUser();
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
      include: {
        option: { select: { label: true } },
      },
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

  const now = Date.now();
  const closesAtMs = event.closesAt.getTime();
  const acceptingTips = !event.settledAt && now < closesAtMs;

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      key: event.key,
      closesAt: event.closesAt.toISOString(),
      settledAt: event.settledAt?.toISOString() ?? null,
      winnerOptionId: event.winnerOptionId,
      acceptingTips,
    },
    options: event.options,
    userPick,
    stakeRequired: 100,
  });
}
