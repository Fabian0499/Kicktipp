import { BetStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { placeWmWinnerSchema } from "@/lib/validation";
import {
  WM_WINNER_EVENT_KEY,
  WM_WINNER_MIN_ODDS,
  WM_WINNER_STAKE,
} from "@/lib/wm-winner";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Bitte zuerst einloggen." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = placeWmWinnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Auswahl." }, { status: 400 });
  }

  const { optionId } = parsed.data;

  const event = await db.wmWinnerEvent.findUnique({
    where: { key: WM_WINNER_EVENT_KEY },
    include: { options: true },
  });

  if (!event || event.settledAt) {
    return NextResponse.json({ error: "WM-Wette ist nicht verfügbar oder bereits ausgewertet." }, { status: 400 });
  }

  const now = new Date();
  if (now >= event.closesAt) {
    return NextResponse.json(
      { error: "Die Abgabefrist für die WM-Sieger-Wette ist vorbei." },
      { status: 400 },
    );
  }

  const option = event.options.find((entry) => entry.id === optionId);
  if (!option) {
    return NextResponse.json({ error: "Unbekannte Auswahl." }, { status: 400 });
  }

  if (option.odds <= WM_WINNER_MIN_ODDS) {
    return NextResponse.json(
      { error: `Quoten von ${WM_WINNER_MIN_ODDS.toFixed(2)} oder weniger sind gesperrt.` },
      { status: 400 },
    );
  }

  const existing = await db.wmWinnerPick.findUnique({
    where: {
      userId_eventId: {
        userId: currentUser.id,
        eventId: event.id,
      },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Du hast für diese WM-Wette bereits einen Tipp abgegeben." }, { status: 400 });
  }

  /** Einsatz kommt aus dem WM-Sonderkontingent (100 P. pro Person), nicht vom Punktekonto – kein Abzug vom Wallet. */
  await db.wmWinnerPick.create({
    data: {
      userId: currentUser.id,
      eventId: event.id,
      optionId: option.id,
      stake: WM_WINNER_STAKE,
      oddsSnapshot: option.odds,
      status: BetStatus.OPEN,
    },
  });

  return NextResponse.json({ ok: true });
}
