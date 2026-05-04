import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminWmWinnerUpdateSchema } from "@/lib/validation";
import { WM_WINNER_EVENT_KEY } from "@/lib/wm-winner";

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }
  if (currentUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminWmWinnerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const event = await db.wmWinnerEvent.findUnique({
    where: { key: WM_WINNER_EVENT_KEY },
    include: { options: true },
  });

  if (!event) {
    return NextResponse.json({ error: "WM-Event nicht gefunden." }, { status: 404 });
  }

  if (event.settledAt) {
    return NextResponse.json({ error: "Auswertung liegt vor – Quoten sind gesperrt." }, { status: 400 });
  }

  const { closesAt, options } = parsed.data;
  const validIds = new Set(event.options.map((option) => option.id));
  for (const row of options) {
    if (!validIds.has(row.id)) {
      return NextResponse.json({ error: "Unbekannte Quoten-Zeile." }, { status: 400 });
    }
  }

  await db.$transaction(async (tx) => {
    if (closesAt) {
      await tx.wmWinnerEvent.update({
        where: { id: event.id },
        data: { closesAt: new Date(closesAt) },
      });
    }
    for (const row of options) {
      await tx.wmWinnerOption.update({
        where: { id: row.id },
        data: { odds: row.odds },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
