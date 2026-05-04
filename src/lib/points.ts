import { PointTransactionType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function createWalletWithInitialCredit(
  userId: string,
  startBalance = 0,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? db;
  const wallet = await client.wallet.create({
    data: {
      userId,
      balance: startBalance,
    },
  });

  if (startBalance > 0) {
    await client.pointTransaction.create({
      data: {
        userId,
        amount: startBalance,
        type: PointTransactionType.CREDIT,
        description: "Startguthaben",
      },
    });
  }

  return wallet;
}

export async function getWalletBalance(userId: string) {
  const wallet = await db.wallet.findUnique({
    where: { userId },
    select: { balance: true },
  });

  return wallet?.balance ?? 0;
}
