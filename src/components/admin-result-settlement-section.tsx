"use client";

import { AdminResultSettlement } from "@/components/admin-result-settlement";
import { usePersistedDetailsOpen } from "@/hooks/use-persisted-details-open";

const STORAGE_KEY = "kicktipp-admin-result-settlement-details-open";

type MatchItem = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  isKnockout: boolean;
  usesQualifyMethodMatrix: boolean;
  homeHalfTimeScore: number | null;
  awayHalfTimeScore: number | null;
  homeScore: number | null;
  awayScore: number | null;
  settledAt: string | null;
  totalCards: number | null;
  totalCorners: number | null;
};

export function AdminResultSettlementSection({ matches }: { matches: MatchItem[] }) {
  const { open, onToggle } = usePersistedDetailsOpen(STORAGE_KEY, true);

  return (
    <details
      className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
      open={open}
      onToggle={onToggle}
    >
      <summary className="cursor-pointer text-xl font-semibold text-zinc-900">
        Ergebnis eintragen, Auswertung &amp; Korrektur
      </summary>
      <AdminResultSettlement matches={matches} />
    </details>
  );
}
