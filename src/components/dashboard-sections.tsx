"use client";

import { useEffect, useMemo, useState } from "react";
import { formatGoalsMatrixOutcomeLabel } from "@/lib/goals-market";
import { formatHandicapMatrixOutcomeLabel } from "@/lib/handicap-market";
import { formatHalfTimeFullTimeDisplayLabel, formatOneXTwoDisplayLabel } from "@/lib/one-x-two-display";
import { formatToQualifyOutcomeDisplay } from "@/lib/to-qualify-method";
import { useLocale, useT } from "@/components/locale-provider";
import type { TranslateFn } from "@/lib/i18n/create-t";
import type { Locale } from "@/lib/i18n/types";
import { displayTeamName, matchTeamsDisplayLabel } from "@/lib/team-display-names";

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

type SectionKey = "open-bets" | "closed-bets" | "open-budgets" | "wallet-history";

const STORAGE_KEY = "dashboard-section-open-state-v1";
const DEFAULT_STATE: Record<SectionKey, boolean> = {
  "open-bets": false,
  "closed-bets": false,
  "open-budgets": false,
  "wallet-history": false,
};

const MARKET_TITLE_KEYS: Record<string, string> = {
  "Einfach-Tipp (1X2)": "dashboard.marketSimple1x2",
  "Einfach-Tipp (Exact Score)": "dashboard.marketSimpleExact",
};

function displayMarketTitle(marketTitle: string, marketType: string, t: TranslateFn): string {
  if (marketType) {
    const typeKey = `markets.${marketType}`;
    const fromType = t(typeKey);
    if (fromType !== typeKey) {
      return fromType;
    }
  }

  const mapped = MARKET_TITLE_KEYS[marketTitle];
  if (mapped) {
    return t(mapped);
  }

  const combiMatch = marketTitle.match(/^Kombi \((.+)\)$/);
  if (combiMatch) {
    return t("dashboard.marketCombi").replace("{market}", displayMarketTitle(combiMatch[1], "", t));
  }

  return marketTitle;
}

function displayOutcomeLabel(
  marketType: string,
  outcome: string,
  homeTeam: string,
  awayTeam: string,
  locale: Locale,
  t: TranslateFn,
): string {
  const homeLabel = displayTeamName(homeTeam, locale);
  const awayLabel = displayTeamName(awayTeam, locale);
  const drawLabel = t("common.draw");

  if (marketType === "ONE_X_TWO") {
    return formatOneXTwoDisplayLabel(outcome, homeLabel, awayLabel, drawLabel);
  }
  if (marketType === "HALF_TIME_FULL_TIME") {
    return formatHalfTimeFullTimeDisplayLabel(outcome, homeLabel, awayLabel, drawLabel);
  }
  if (marketType === "HANDICAP_MATRIX") {
    return formatHandicapMatrixOutcomeLabel(outcome, t("common.home"), t("common.away"), drawLabel);
  }
  if (marketType === "GOALS_MATRIX") {
    return formatGoalsMatrixOutcomeLabel(outcome, locale);
  }
  if (marketType === "TO_QUALIFY") {
    return formatToQualifyOutcomeDisplay(outcome, homeLabel, awayLabel, locale);
  }
  if (outcome === "Ja") {
    return t("common.yes");
  }
  if (outcome === "Nein") {
    return t("common.no");
  }
  return outcome;
}

export function DashboardSections({
  openBets,
  closedBets,
  budgetRows,
  walletTransactions,
}: {
  openBets: BetRow[];
  closedBets: BetRow[];
  budgetRows: BudgetRow[];
  walletTransactions: TransactionRow[];
}) {
  const t = useT();
  const { locale } = useLocale();
  const dateLocale = locale === "en" ? "en-GB" : "de-DE";
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
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">{t("dashboard.openBets")}</summary>
        {openBets.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">{t("dashboard.openBetsEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {openBets.map((bet) => (
              <li key={bet.id} className="rounded-md border p-3">
                <p className="font-medium">{matchTeamsDisplayLabel(bet.homeTeam, bet.awayTeam, locale)}</p>
                <p className="text-sm text-zinc-700">
                  {displayMarketTitle(bet.marketTitle, bet.marketType, t)}:{" "}
                  {displayOutcomeLabel(bet.marketType, bet.outcomeLabel, bet.homeTeam, bet.awayTeam, locale, t)} @{" "}
                  {bet.oddsSnapshot.toFixed(2)}
                </p>
                <p className="text-sm text-zinc-600">
                  {t("dashboard.stake")}: {bet.stake} {t("common.points")} | {t("dashboard.kickoff")}:{" "}
                  {new Date(bet.startsAt).toLocaleString(dateLocale)}
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
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">{t("dashboard.closedBets")}</summary>
        {closedBets.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">{t("dashboard.closedBetsEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {closedBets.map((bet) => (
              <li key={bet.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{matchTeamsDisplayLabel(bet.homeTeam, bet.awayTeam, locale)}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      bet.status === "WON"
                        ? "bg-emerald-100 text-emerald-800"
                        : bet.status === "LOST"
                          ? "bg-red-100 text-red-800"
                          : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {bet.status === "WON"
                      ? t("dashboard.statusWon")
                      : bet.status === "LOST"
                        ? t("dashboard.statusLost")
                        : t("dashboard.statusVoid")}
                  </span>
                </div>
                <p className="text-sm text-zinc-700">
                  {displayMarketTitle(bet.marketTitle, bet.marketType, t)}:{" "}
                  {displayOutcomeLabel(bet.marketType, bet.outcomeLabel, bet.homeTeam, bet.awayTeam, locale, t)} @{" "}
                  {bet.oddsSnapshot.toFixed(2)}
                </p>
                <p className="text-sm text-zinc-600">
                  {t("dashboard.stake")}: {bet.stake} {t("common.points")} | {t("dashboard.kickoff")}:{" "}
                  {new Date(bet.startsAt).toLocaleString(dateLocale)}
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
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">{t("dashboard.budgets")}</summary>
        {budgetRows.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">{t("dashboard.budgetsEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {budgetRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-md border p-3 text-zinc-900">
                <span>{matchTeamsDisplayLabel(row.homeTeam, row.awayTeam, locale)}</span>
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
        <summary className="cursor-pointer text-xl font-semibold text-zinc-900">{t("dashboard.walletHistory")}</summary>
        {walletTransactions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">{t("dashboard.walletHistoryEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {walletTransactions.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-md border p-3 text-zinc-900">
                <span className="text-zinc-900">
                  {entry.description === "Initiales Startguthaben"
                    ? t("dashboard.startBalance")
                    : entry.description}
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
    </>
  );
}
