import type { MarketType, Prisma } from "@prisma/client";
import {
  buildThresholdMatrixOptions,
  type ThresholdMatrixPrefix,
  type ThresholdMatrixRow,
} from "@/lib/threshold-matrix-options";

type Tx = Prisma.TransactionClient;

export class ThresholdMatrixSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThresholdMatrixSyncError";
  }
}

export async function syncThresholdMatrixMarket(
  tx: Tx,
  params: {
    matchId: string;
    marketType: Extract<MarketType, "CARDS_MATRIX" | "CORNERS_MATRIX">;
    prefix: ThresholdMatrixPrefix;
    matrixStart: number;
    matrixRowCount: number;
    rows: ThresholdMatrixRow[];
    matchStartField: "cardsMatrixStart" | "cornersMatrixStart";
    matchRowCountField: "cardsMatrixRowCount" | "cornersMatrixRowCount";
  },
) {
  const market = await tx.matchMarket.findUnique({
    where: {
      matchId_type: {
        matchId: params.matchId,
        type: params.marketType,
      },
    },
    include: { options: true },
  });

  if (!market) {
    return false;
  }

  const desired = buildThresholdMatrixOptions(params.prefix, params.matrixStart, params.rows);
  const desiredByOutcome = new Map(desired.map((item) => [item.outcome, item.odds]));
  const currentByOutcome = new Map(market.options.map((option) => [option.outcome, option]));

  for (const option of market.options) {
    if (desiredByOutcome.has(option.outcome)) {
      continue;
    }
    const betCount = await tx.bet.count({ where: { marketOptionId: option.id } });
    if (betCount > 0) {
      throw new ThresholdMatrixSyncError(
        "Zeilen können nicht entfernt oder geändert werden, solange Tipps auf betroffene Quoten existieren.",
      );
    }
  }

  for (const option of market.options) {
    if (!desiredByOutcome.has(option.outcome)) {
      await tx.marketOption.delete({ where: { id: option.id } });
    }
  }

  for (const [outcome, odds] of desiredByOutcome) {
    const existing = currentByOutcome.get(outcome);
    if (existing) {
      if (existing.odds !== odds) {
        await tx.marketOption.update({
          where: { id: existing.id },
          data: { odds },
        });
      }
    } else {
      await tx.marketOption.create({
        data: {
          marketId: market.id,
          outcome,
          odds,
        },
      });
    }
  }

  await tx.match.update({
    where: { id: params.matchId },
    data: {
      [params.matchStartField]: params.matrixStart,
      [params.matchRowCountField]: params.matrixRowCount,
    },
  });

  return true;
}
