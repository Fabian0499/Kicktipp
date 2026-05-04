import { PointTransactionType, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { createWalletWithInitialCredit } from "@/lib/points";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`register:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const { email, username, name, password } = parsed.data;
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "E-Mail bereits registriert." }, { status: 409 });
  }
  const existingUsername = await db.user.findUnique({ where: { username } });
  if (existingUsername) {
    return NextResponse.json({ error: "Benutzername bereits vergeben." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
        status: UserStatus.PENDING,
      },
    });

    await createWalletWithInitialCredit(createdUser.id, 0, tx);

    const openMatches = await tx.match.findMany({
      where: {
        isPublished: true,
        settledAt: null,
      },
      select: { id: true, homeTeam: true, awayTeam: true, isKnockout: true },
    });

    if (openMatches.length > 0) {
      await tx.userMatchBudget.createMany({
        data: openMatches.map((match) => ({
          userId: createdUser.id,
          matchId: match.id,
          allocated: match.isKnockout ? 200 : 100,
          spent: 0,
        })),
      });

      await tx.pointTransaction.createMany({
        data: openMatches.map((match) => ({
          userId: createdUser.id,
          amount: match.isKnockout ? 200 : 100,
          type: PointTransactionType.CREDIT,
          description: `Spielbudget freigegeben (${match.isKnockout ? "KO" : "Liga"}): ${match.homeTeam} vs. ${match.awayTeam}`,
        })),
      });
    }

    return createdUser;
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    message: "Registrierung erfolgreich. Dein Konto wird nach Admin-Freigabe aktiviert.",
  });
}
