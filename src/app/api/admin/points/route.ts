import { PointTransactionType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminAdjustPointsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }
  if (currentUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminAdjustPointsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const { userId, mode, amount, reason } = parsed.data;

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });
  if (!targetUser || !targetUser.wallet) {
    return NextResponse.json({ error: "Benutzerkonto nicht gefunden." }, { status: 404 });
  }

  if (mode === "debit" && targetUser.wallet.balance < amount) {
    return NextResponse.json({ error: "Benutzer hat nicht genug Punkte für diesen Abzug." }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: mode === "credit" ? { increment: amount } : { decrement: amount },
      },
    });

    await tx.pointTransaction.create({
      data: {
        userId,
        amount,
        type: mode === "credit" ? PointTransactionType.CREDIT : PointTransactionType.DEBIT,
        description: `Admin-Korrektur: ${reason}`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
