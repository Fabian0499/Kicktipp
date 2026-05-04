import { BetStatus, PointTransactionType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { netBetProfitFromOdds } from "@/lib/bet-payout";
import { adminWmWinnerSettleSchema } from "@/lib/validation";
import { WM_WINNER_EVENT_KEY, WM_WINNER_MAX_PAYOUT } from "@/lib/wm-winner";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }
  if (currentUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminWmWinnerSettleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const { winningOptionId } = parsed.data;

  const event = await db.wmWinnerEvent.findUnique({
    where: { key: WM_WINNER_EVENT_KEY },
    include: { options: true },
  });

  if (!event) {
    return NextResponse.json({ error: "WM-Event nicht gefunden." }, { status: 404 });
  }

  if (event.settledAt) {
    return NextResponse.json({ error: "Bereits ausgewertet." }, { status: 400 });
  }

  const winnerOption = event.options.find((option) => option.id === winningOptionId);
  if (!winnerOption) {
    return NextResponse.json({ error: "Siegermannschaft gehört nicht zu dieser Wette." }, { status: 400 });
  }

  const openPicks = await db.wmWinnerPick.findMany({
    where: {
      eventId: event.id,
      status: BetStatus.OPEN,
    },
  });

  await db.$transaction(async (tx) => {
    await tx.wmWinnerEvent.update({
      where: { id: event.id },
      data: {
        settledAt: new Date(),
        winnerOptionId: winningOptionId,
      },
    });

    for (const pick of openPicks) {
      const won = pick.optionId === winningOptionId;
      const rawProfit = netBetProfitFromOdds(pick.stake, pick.oddsSnapshot);
      const payout = won ? Math.min(rawProfit, WM_WINNER_MAX_PAYOUT) : 0;

      await tx.wmWinnerPick.update({
        where: { id: pick.id },
        data: {
          status: won ? BetStatus.WON : BetStatus.LOST,
          payoutAmount: won ? payout : null,
        },
      });

      if (won && payout > 0) {
        await tx.wallet.upsert({
          where: { userId: pick.userId },
          create: {
            userId: pick.userId,
            balance: payout,
          },
          update: {
            balance: { increment: payout },
          },
        });
        await tx.pointTransaction.create({
          data: {
            userId: pick.userId,
            amount: payout,
            type: PointTransactionType.CREDIT,
            description: `WM Sieger 2026 – Gewinn (${winnerOption.label})`,
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true, settledPicks: openPicks.length });
}
