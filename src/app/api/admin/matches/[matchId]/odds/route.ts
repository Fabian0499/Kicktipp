import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { syncThresholdMatrixMarket, ThresholdMatrixSyncError } from "@/lib/admin-threshold-matrix-sync";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUpdateMatchOddsSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }
  if (currentUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { matchId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = adminUpdateMatchOddsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      markets: {
        include: {
          options: {
            select: { id: true, odds: true, outcome: true },
          },
        },
      },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Spiel nicht gefunden." }, { status: 404 });
  }

  if (match.settledAt) {
    return NextResponse.json({ error: "Spiel wurde bereits ausgewertet – Quoten sind gesperrt." }, { status: 400 });
  }

  const currentOddsByOptionId = new Map(
    match.markets.flatMap((market) => market.options.map((option) => [option.id, option.odds] as const)),
  );
  for (const option of parsed.data.options) {
    if (!currentOddsByOptionId.has(option.id)) {
      return NextResponse.json({ error: "Unbekannte Quoten-Zeile für dieses Spiel." }, { status: 400 });
    }
  }

  const newStartsAt = new Date(parsed.data.startsAt);
  const startsAtChanged = match.startsAt.getTime() !== newStartsAt.getTime();

  try {
    await db.$transaction(async (tx) => {
      const changedOptions = parsed.data.options.filter(
        (option) => currentOddsByOptionId.get(option.id) !== option.odds,
      );
      for (const option of changedOptions) {
        await tx.marketOption.update({
          where: { id: option.id },
          data: { odds: option.odds },
        });
      }

      if (startsAtChanged) {
        await tx.match.update({
          where: { id: matchId },
          data: { startsAt: newStartsAt },
        });
      }

      if (parsed.data.cardsMatrix) {
        await syncThresholdMatrixMarket(tx, {
          matchId,
          marketType: "CARDS_MATRIX",
          prefix: "CARDS",
          matrixStart: parsed.data.cardsMatrix.matrixStart,
          matrixRowCount: parsed.data.cardsMatrix.matrixRowCount,
          rows: parsed.data.cardsMatrix.rows,
          matchStartField: "cardsMatrixStart",
          matchRowCountField: "cardsMatrixRowCount",
        });
      }

      if (parsed.data.cornersMatrix) {
        await syncThresholdMatrixMarket(tx, {
          matchId,
          marketType: "CORNERS_MATRIX",
          prefix: "CORNERS",
          matrixStart: parsed.data.cornersMatrix.matrixStart,
          matrixRowCount: parsed.data.cornersMatrix.matrixRowCount,
          rows: parsed.data.cornersMatrix.rows,
          matchStartField: "cornersMatrixStart",
          matchRowCountField: "cornersMatrixRowCount",
        });
      }
    });
  } catch (error) {
    if (error instanceof ThresholdMatrixSyncError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json({
    ok: true,
    updatedOddsCount: parsed.data.options.filter(
      (option) => currentOddsByOptionId.get(option.id) !== option.odds,
    ).length,
    startsAtUpdated: startsAtChanged,
  });
}
