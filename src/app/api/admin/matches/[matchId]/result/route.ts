import { MarketType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, interactiveTransactionOptions } from "@/lib/db";
import {
  applyMatchSettlement,
  reverseMatchSettlement,
  validateKnockoutSettlement,
  type MatchSettlementInput,
} from "@/lib/match-settlement";
import { qualifyMarketUsesMethodMatrix } from "@/lib/to-qualify-method";
import { settleMatchSchema } from "@/lib/validation";
import type { KnockoutDecidedBy } from "@/lib/to-qualify-method";

async function loadMatchForSettlement(matchId: string) {
  return db.match.findUnique({
    where: { id: matchId },
    include: {
      markets: {
        where: { type: MarketType.TO_QUALIFY },
        include: {
          options: {
            select: { outcome: true },
          },
        },
      },
    },
  });
}

function buildSettlementInput(parsed: {
  homeHalfTimeScore: number;
  awayHalfTimeScore: number;
  homeScore: number;
  awayScore: number;
  totalCards: number;
  totalCorners: number;
  knockoutDecidedBy?: KnockoutDecidedBy;
  knockoutAdvancingIsHome?: boolean;
}): MatchSettlementInput {
  return {
    homeHalfTimeScore: parsed.homeHalfTimeScore,
    awayHalfTimeScore: parsed.awayHalfTimeScore,
    homeScore: parsed.homeScore,
    awayScore: parsed.awayScore,
    totalCards: parsed.totalCards,
    totalCorners: parsed.totalCorners,
    knockoutDecidedBy: parsed.knockoutDecidedBy,
    knockoutAdvancingIsHome: parsed.knockoutAdvancingIsHome,
  };
}

async function authorizeAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 }) };
  }
  if (currentUser.role !== UserRole.ADMIN) {
    return { error: NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 }) };
  }
  return { currentUser };
}

export async function POST(request: Request, context: { params: Promise<{ matchId: string }> }) {
  try {
    const auth = await authorizeAdmin();
    if (auth.error) {
      return auth.error;
    }

    const { matchId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = settleMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültiges Ergebnis." }, { status: 400 });
    }

    const match = await loadMatchForSettlement(matchId);
    if (!match) {
      return NextResponse.json({ error: "Spiel nicht gefunden." }, { status: 404 });
    }

    if (match.settledAt) {
      return NextResponse.json({ error: "Spiel wurde bereits ausgewertet." }, { status: 400 });
    }

    const qualifyOptions = match.markets[0]?.options ?? [];
    const usesQualifyMethodMatrix = qualifyMarketUsesMethodMatrix(qualifyOptions);
    const knockoutError = validateKnockoutSettlement({
      isKnockout: match.isKnockout,
      usesQualifyMethodMatrix,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      knockoutDecidedBy: parsed.data.knockoutDecidedBy,
      knockoutAdvancingIsHome: parsed.data.knockoutAdvancingIsHome,
    });
    if (knockoutError) {
      return NextResponse.json({ error: knockoutError }, { status: 400 });
    }

    const input = buildSettlementInput(parsed.data);
    const settledCount = await db.$transaction(
      async (tx) =>
        applyMatchSettlement(
          tx,
          { id: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, isKnockout: match.isKnockout },
          input,
          usesQualifyMethodMatrix,
        ),
      interactiveTransactionOptions,
    );

    return NextResponse.json({ ok: true, settledCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler bei der Auswertung.";
    return NextResponse.json({ error: `Auswertung fehlgeschlagen: ${message}` }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ matchId: string }> }) {
  try {
    const auth = await authorizeAdmin();
    if (auth.error) {
      return auth.error;
    }

    const { matchId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = settleMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültiges Ergebnis." }, { status: 400 });
    }

    const match = await loadMatchForSettlement(matchId);
    if (!match) {
      return NextResponse.json({ error: "Spiel nicht gefunden." }, { status: 404 });
    }

    if (!match.settledAt) {
      return NextResponse.json({ error: "Spiel ist noch nicht ausgewertet." }, { status: 400 });
    }

    const qualifyOptions = match.markets[0]?.options ?? [];
    const usesQualifyMethodMatrix = qualifyMarketUsesMethodMatrix(qualifyOptions);
    const knockoutError = validateKnockoutSettlement({
      isKnockout: match.isKnockout,
      usesQualifyMethodMatrix,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      knockoutDecidedBy: parsed.data.knockoutDecidedBy,
      knockoutAdvancingIsHome: parsed.data.knockoutAdvancingIsHome,
    });
    if (knockoutError) {
      return NextResponse.json({ error: knockoutError }, { status: 400 });
    }

    const input = buildSettlementInput(parsed.data);
    const matchCore = {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      isKnockout: match.isKnockout,
    };

    const result = await db.$transaction(
      async (tx) => {
        const reversed = await reverseMatchSettlement(tx, matchCore);
        const settledCount = await applyMatchSettlement(tx, matchCore, input, usesQualifyMethodMatrix);
        return { ...reversed, settledCount };
      },
      interactiveTransactionOptions,
    );

    return NextResponse.json({ ok: true, corrected: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler bei der Korrektur.";
    return NextResponse.json({ error: `Korrektur fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
