import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "Ungültige Quoten." }, { status: 400 });
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      markets: {
        include: {
          options: {
            select: { id: true, odds: true },
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

  const changedOptions = parsed.data.options.filter((option) => currentOddsByOptionId.get(option.id) !== option.odds);
  for (const option of changedOptions) {
    await db.marketOption.update({
      where: { id: option.id },
      data: { odds: option.odds },
    });
  }

  return NextResponse.json({ ok: true, updatedCount: changedOptions.length });
}
