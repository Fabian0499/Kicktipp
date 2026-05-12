"use client";

import { useEffect, useMemo, useState } from "react";
import { formatHandicapMatrixOutcomeLabel } from "@/lib/handicap-market";

type BetRow = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  marketTitle: string;
  marketType: string;
  outcomeLabel: string;
  oddsSnapshot: number;
  stake: number;
  status: "OPEN" | "WON" | "LOST" | "VOID";
};

type BudgetRow = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  allocated: number;
  spent: number;
};

type TransactionRow = {
  id: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
};

type SectionKey =
  | "open-bets"
  | "closed-bets"
  | "open-budgets"
  | "wallet-history"
  | "budget-history";

const STORAGE_KEY = "dashboard-section-open-state-v1";
const DEFAULT_STATE: Record<SectionKey, boolean> = {
  "open-bets": false,
  "closed-bets": false,
  "open-budgets": false,
  "wallet-history": false,
  "budget-history": false,
};

function displayOutcomeLabel(marketType: string, outcome: string, homeLabel?: string, awayLabel?: string): string {
  if (marketType === "HANDICAP_MATRIX") {
    return formatHandicapMatrixOutcomeLabel(outcome, homeLabel, awayLabel);
  }
  return outcome;
}

export function DashboardSections({
  openBets,
  closedBets,
  budgetRows,
  walletTransactions,
  budgetTransactions,
}: {
  openBets: BetRow[];
  closedBets: BetRow[];
  budgetRows: BudgetRow[];
  walletTransactions: TransactionRow[];
  budgetTransactions: TransactionRow[];
}) {
  const [sectionState, setSectionState] = useState<Record<SectionKey, boolean>>(DEFAULT_STATE);
  const loaded = useMemo(() => typeof window !== "undefined", []);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as Partial<Record<SectionKey, boolean>>;
    queueMicrotask(() => {
      setSectionState((prev) => ({ ...prev, ...parsed }));
    });
  }, [loaded]);

  function onToggle(key: SectionKey, isOpen: boolean) {
    setSectionState((prev) => {
      const next = { ...prev, [key]: isOpen };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <>
      <details
        className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
        open={sectionState["open-bets"]}
        onToggle={(event) => onToggle("open-bets", (event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">Offene Tipps</summary>
        {openBets.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Aktuell keine offenen Tipps.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {openBets.map((bet) => (
              <li key={bet.id} className="rounded-md border p-3">
                <p className="font-medium">
                  {bet.homeTeam} vs. {bet.awayTeam}
                </p>
                <p className="text-sm text-zinc-700">
                  {bet.marketTitle}:{" "}
                  {displayOutcomeLabel(bet.marketType, bet.outcomeLabel, bet.homeTeam, bet.awayTeam)} @{" "}
                  {bet.oddsSnapshot.toFixed(2)}
                </p>
                <p className="text-sm text-zinc-600">
                  Einsatz: {bet.stake} Punkte | Anstoß: {new Date(bet.startsAt).toLocaleString("de-DE")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details
        className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
        open={sectionState["closed-bets"]}
        onToggle={(event) => onToggle("closed-bets", (event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">Geschlossene Tipps</summary>
        {closedBets.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Aktuell keine geschlossenen Tipps.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {closedBets.map((bet) => (
              <li key={bet.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {bet.homeTeam} vs. {bet.awayTeam}
                  </p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      bet.status === "WON"
                        ? "bg-emerald-100 text-emerald-800"
                        : bet.status === "LOST"
                          ? "bg-red-100 text-red-800"
                          : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {bet.status === "WON" ? "Gewonnen" : bet.status === "LOST" ? "Verloren" : "Ungültig"}
                  </span>
                </div>
                <p className="text-sm text-zinc-700">
                  {bet.marketTitle}:{" "}
                  {displayOutcomeLabel(bet.marketType, bet.outcomeLabel, bet.homeTeam, bet.awayTeam)} @{" "}
                  {bet.oddsSnapshot.toFixed(2)}
                </p>
                <p className="text-sm text-zinc-600">
                  Einsatz: {bet.stake} Punkte | Anstoß: {new Date(bet.startsAt).toLocaleString("de-DE")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details
        className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
        open={sectionState["open-budgets"]}
        onToggle={(event) => onToggle("open-budgets", (event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">Offene Spielbudgets pro Match</summary>
        {budgetRows.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Derzeit keine offenen Spiele mit Budget.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {budgetRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-md border p-3 text-zinc-900">
                <span>
                  {row.homeTeam} vs. {row.awayTeam}
                </span>
                <span className="font-semibold">
                  {Math.max(0, row.allocated - row.spent)}/{row.allocated}
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details
        className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
        open={sectionState["wallet-history"]}
        onToggle={(event) => onToggle("wallet-history", (event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">Historie Punktekonto</summary>
        {walletTransactions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Noch keine Transaktionen vorhanden.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {walletTransactions.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-md border p-3 text-zinc-900">
                <span className="text-zinc-900">
                  {entry.description === "Initiales Startguthaben" ? "Startguthaben" : entry.description}
                </span>
                <span className="font-semibold text-zinc-900">
                  {entry.type === "CREDIT" ? "+" : "-"}
                  {entry.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details
        className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
        open={sectionState["budget-history"]}
        onToggle={(event) => onToggle("budget-history", (event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">Historie Spielbudget</summary>
        {budgetTransactions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Noch keine Spielbudget-Transaktionen vorhanden.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {budgetTransactions.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-md border p-3 text-zinc-900">
                <span className="text-zinc-900">{entry.description}</span>
                <span className="font-semibold text-zinc-900">
                  {entry.type === "CREDIT" ? "+" : "-"}
                  {entry.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </>
  );
}
