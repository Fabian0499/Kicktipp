"use client";

import type { MarketType } from "@prisma/client";
import {
  cardsMatrixThresholdsFromOutcomes,
  formatCardsMatrixOutcomeLabel,
} from "@/lib/cards-market";
import {
  cornersMatrixThresholdsFromOutcomes,
  formatCornersMatrixOutcomeLabel,
} from "@/lib/corners-market";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { netBetProfitFromGrossReturn } from "@/lib/bet-payout";
import { profiBetConflictsOpenSet } from "@/lib/betting-conflicts";
import { MIN_BETTABLE_ODDS, oddsViolateMinimumForMarket } from "@/lib/min-bettable-odds";

const LEAGUE_MATCH_BET_BUDGET = 100;
const KO_MATCH_BET_BUDGET = 200;
const LEAGUE_MAX_PAYOUT_PER_BET = 400;
const KO_MAX_PAYOUT_PER_BET = 600;
const LEAGUE_MAX_PAYOUT_PER_MATCH = 600;
const KO_MAX_PAYOUT_PER_MATCH = 900;

type Option = {
  id: string;
  outcome: string;
  odds: number;
};

type Market = {
  id: string;
  type: string;
  title: string;
  options: Option[];
};

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  isKnockout: boolean;
  markets: Market[];
};

type SelectedBet = {
  matchId: string;
  matchLabel: string;
  marketTitle: string;
  marketType: string;
  optionId: string;
  outcome: string;
  odds: number;
};

type PlacedBetInfo = {
  matchLabel: string;
  marketTitle: string;
  outcome: string;
  odds: number;
  stake: number;
};

export function BetsBoard({
  matches,
  isAuthenticated,
  existingSimpleTipByMatch,
  openProfiBetsByMatch,
  usedStakeByMatch,
  allocatedBudgetByMatch,
}: {
  matches: Match[];
  isAuthenticated: boolean;
  existingSimpleTipByMatch: Record<string, string>;
  openProfiBetsByMatch: Record<string, Array<{ marketType: string; outcomeLabel: string }>>;
  usedStakeByMatch: Record<string, number>;
  allocatedBudgetByMatch: Record<string, number>;
}) {
  const [variant, setVariant] = useState<"profi" | "einfach">("profi");
  const [selections, setSelections] = useState<SelectedBet[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [expandedMatchIds, setExpandedMatchIds] = useState<string[]>([]);
  const [simpleTipInputs, setSimpleTipInputs] = useState<
    Record<string, { home: string; away: string; saving: boolean }>
  >({});
  const [stake, setStake] = useState("80");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [placedBetInfo, setPlacedBetInfo] = useState<PlacedBetInfo | null>(null);
  const [simpleSuccessByMatch, setSimpleSuccessByMatch] = useState<Record<string, string>>({});
  const [localUsedStakeByMatch, setLocalUsedStakeByMatch] = useState<Record<string, number>>(usedStakeByMatch);
  const [localOpenProfiBetsByMatch, setLocalOpenProfiBetsByMatch] =
    useState<Record<string, Array<{ marketType: string; outcomeLabel: string }>>>(openProfiBetsByMatch);
  const [localSimpleTipByMatch, setLocalSimpleTipByMatch] =
    useState<Record<string, string>>(existingSimpleTipByMatch);

  useEffect(() => {
    setLocalOpenProfiBetsByMatch(openProfiBetsByMatch);
  }, [openProfiBetsByMatch]);

  useEffect(() => {
    setLocalSimpleTipByMatch(existingSimpleTipByMatch);
  }, [existingSimpleTipByMatch]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  const selectedMatchId = selections[0]?.matchId ?? null;
  const selectedMatch = selectedMatchId ? matches.find((match) => match.id === selectedMatchId) : null;
  const selectedDefaultBudget = selectedMatch?.isKnockout ? KO_MATCH_BET_BUDGET : LEAGUE_MATCH_BET_BUDGET;
  const selectedTotalBudget = selectedMatchId
    ? (allocatedBudgetByMatch[selectedMatchId] ?? selectedDefaultBudget)
    : 0;
  const remainingBudgetForSelectedMatch = selectedMatchId
    ? Math.max(0, selectedTotalBudget - (localUsedStakeByMatch[selectedMatchId] ?? 0))
    : 0;
  const combinedOdds = useMemo(
    () => selections.reduce((acc, selection) => acc * selection.odds, 1),
    [selections],
  );
  const maxPayoutPerBet = selectedMatch?.isKnockout ? KO_MAX_PAYOUT_PER_BET : LEAGUE_MAX_PAYOUT_PER_BET;
  const maxPayoutPerMatch = selectedMatch?.isKnockout ? KO_MAX_PAYOUT_PER_MATCH : LEAGUE_MAX_PAYOUT_PER_MATCH;
  const maxStakeByPerBetCap = useMemo(() => {
    if (!Number.isFinite(combinedOdds) || combinedOdds <= 0) {
      return 0;
    }
    return Math.floor(maxPayoutPerBet / combinedOdds);
  }, [combinedOdds, maxPayoutPerBet]);
  const maxStakeForSelectedBet = useMemo(
    () => Math.max(0, Math.min(remainingBudgetForSelectedMatch, maxStakeByPerBetCap)),
    [remainingBudgetForSelectedMatch, maxStakeByPerBetCap],
  );

  function isProfiOptionBlocked(matchId: string, marketType: string, outcome: string): boolean {
    const open = localOpenProfiBetsByMatch[matchId] ?? [];
    return profiBetConflictsOpenSet(
      { marketType: marketType as MarketType, outcomeLabel: outcome },
      open.map((entry) => ({ marketType: entry.marketType as MarketType, outcomeLabel: entry.outcomeLabel })),
    );
  }

  const canSubmitStake = useMemo(() => {
    const value = Number(stake);
    if (!Number.isInteger(value) || value < 1 || remainingBudgetForSelectedMatch < 1) {
      return false;
    }
    return value <= maxStakeForSelectedBet;
  }, [stake, remainingBudgetForSelectedMatch, maxStakeForSelectedBet]);

  useEffect(() => {
    const currentStake = Number(stake);
    if (!Number.isInteger(currentStake) || currentStake < 1) {
      return;
    }
    if (maxStakeForSelectedBet < 1) {
      return;
    }
    if (currentStake > maxStakeForSelectedBet) {
      setStake(String(maxStakeForSelectedBet));
    }
  }, [stake, maxStakeForSelectedBet]);

  const possibleWin = useMemo(() => {
    const numericStake = Number(stake);
    if (!Number.isFinite(numericStake) || numericStake <= 0) {
      return 0;
    }
    const grossReturn = Math.round(numericStake * combinedOdds);
    const cappedReturn = Math.min(grossReturn, maxPayoutPerBet);
    return netBetProfitFromGrossReturn(cappedReturn, numericStake);
  }, [stake, combinedOdds, maxPayoutPerBet]);

  async function placeBet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selections.length === 0) {
      return;
    }
    if (!canSubmitStake) {
      setError(`Bitte einen Einsatz zwischen 1 und ${maxStakeForSelectedBet} Punkten eingeben.`);
      return;
    }

    const pending = selections[0];
    if (pending && isProfiOptionBlocked(pending.matchId, pending.marketType, pending.outcome)) {
      setError(
        "Diese Auswahl ist nicht möglich: Zusammen mit deinen bereits offenen Tipps im selben Spiel würdest du alle Ausgänge abdecken (Absicherung ist nicht erlaubt).",
      );
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");

    const stakeToPlace = Number(stake);
    const response = await fetch("/api/bets/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selections: selections.map((selection) => ({
          matchId: selection.matchId,
          marketOptionId: selection.optionId,
        })),
        stake: stakeToPlace,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Einsatz konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    const placedSelection = selections[0];
    const placedStake = Number(stake);
    setSaving(false);
    setSelections([]);
    setMessage("Wette wurde erfolgreich platziert.");
    setPlacedBetInfo(
      placedSelection
        ? {
            matchLabel: placedSelection.matchLabel,
            marketTitle: placedSelection.marketTitle,
            outcome: placedSelection.outcome,
            odds: placedSelection.odds,
            stake: placedStake,
          }
        : null,
    );
    setStake("80");
    if (placedSelection) {
      setLocalUsedStakeByMatch((current) => ({
        ...current,
        [placedSelection.matchId]: (current[placedSelection.matchId] ?? 0) + placedStake,
      }));
      setLocalOpenProfiBetsByMatch((current) => {
        const list = current[placedSelection.matchId] ?? [];
        return {
          ...current,
          [placedSelection.matchId]: [
            ...list,
            {
              marketType: placedSelection.marketType,
              outcomeLabel: placedSelection.outcome,
            },
          ],
        };
      });
    }
  }

  function toggleSelection(selection: SelectedBet) {
    setError("");
    setMessage("");
    setIsSlipOpen(true);
    setSelections((current) => {
      if (current.some((item) => item.optionId === selection.optionId)) {
        return current.filter((item) => item.optionId !== selection.optionId);
      }
      return [selection];
    });
  }

  function toggleMatchExpansion(matchId: string) {
    setExpandedMatchIds((current) =>
      current.includes(matchId) ? current.filter((id) => id !== matchId) : [...current, matchId],
    );
  }

  async function placeSimpleTip(matchId: string) {
    const match = matches.find((entry) => entry.id === matchId);
    const simpleTipTotalStake = match?.isKnockout ? 200 : 100;
    const totalBudget = allocatedBudgetByMatch[matchId] ?? (match?.isKnockout ? KO_MATCH_BET_BUDGET : LEAGUE_MATCH_BET_BUDGET);
    const remainingBudget = Math.max(0, totalBudget - (localUsedStakeByMatch[matchId] ?? 0));
    if (remainingBudget < simpleTipTotalStake) {
      setError("Für diesen Einfach-Tipp reicht dein verbleibendes Spielbudget nicht mehr aus.");
      return;
    }

    const input = simpleTipInputs[matchId] ?? { home: "", away: "", saving: false };
    const predictedHome = Number(input.home);
    const predictedAway = Number(input.away);

    if (!Number.isInteger(predictedHome) || predictedHome < 0 || !Number.isInteger(predictedAway) || predictedAway < 0) {
      setError("Bitte ein gültiges Ergebnis für den Einfach-Tipp eingeben.");
      return;
    }
    setError("");
    setMessage("");
    setSimpleTipInputs((current) => ({
      ...current,
      [matchId]: {
        ...input,
        saving: true,
      },
    }));

    const response = await fetch("/api/simple-tips/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        predictedHome,
        predictedAway,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Einfach-Tipp konnte nicht gespeichert werden.");
      setSimpleTipInputs((current) => ({
        ...current,
        [matchId]: {
          ...input,
          saving: false,
        },
      }));
      return;
    }

    setMessage("Einfach-Tipp wurde erfolgreich platziert.");
    setSimpleSuccessByMatch((current) => ({
      ...current,
      [matchId]: "Wette wurde erfolgreich platziert",
    }));
    window.setTimeout(() => {
      setSimpleSuccessByMatch((current) => {
        const next = { ...current };
        delete next[matchId];
        return next;
      });
    }, 5000);
    setSimpleTipInputs((current) => ({
      ...current,
      [matchId]: {
        home: "",
        away: "",
        saving: false,
      },
    }));
    setLocalUsedStakeByMatch((current) => ({
      ...current,
      [matchId]: (current[matchId] ?? 0) + simpleTipTotalStake,
    }));
    setLocalSimpleTipByMatch((current) => ({
      ...current,
      [matchId]: `${predictedHome}:${predictedAway}`,
    }));
  }

  return (
    <>
      {matches.length === 0 ? (
        <div className="mt-5 rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
          <p>Noch keine Wett-Ereignisse veröffentlicht.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex w-fit rounded-md border bg-white p-1 text-sm text-zinc-900">
            <button
              type="button"
              onClick={() => setVariant("einfach")}
              className={`cursor-pointer rounded px-3 py-1.5 ${variant === "einfach" ? "bg-black text-white" : ""}`}
            >
              Billo-Variante
            </button>
            <button
              type="button"
              onClick={() => setVariant("profi")}
              className={`cursor-pointer rounded px-3 py-1.5 ${variant === "profi" ? "bg-black text-white" : ""}`}
            >
              Profi Variante
            </button>
          </div>

          {matches.map((match) => {
            const totalBudget = allocatedBudgetByMatch[match.id] ?? (match.isKnockout ? KO_MATCH_BET_BUDGET : LEAGUE_MATCH_BET_BUDGET);
            const usedStake = localUsedStakeByMatch[match.id] ?? 0;
            const remainingBudget = Math.max(0, totalBudget - usedStake);
            const simpleOneXTwoStake = match.isKnockout ? 140 : 80;
            const simpleExactStake = match.isKnockout ? 60 : 20;
            const simpleTotalStake = simpleOneXTwoStake + simpleExactStake;
            const goalMarkets = match.markets.filter((market) => market.type.startsWith("OVER_UNDER_"));
            const halfTimeOneXTwoMarkets = match.markets.filter(
              (market) => market.type === "HALF_TIME_ONE_X_TWO",
            );
            const halfTimeFullTimeMarkets = match.markets.filter(
              (market) => market.type === "HALF_TIME_FULL_TIME",
            );
            const exactScoreMarkets = match.markets.filter((market) => market.type === "EXACT_SCORE");
            const combinedOutcomeMarkets = match.markets.filter(
              (market) => market.type === "ONE_X_TWO" || market.type === "DOUBLE_CHANCE",
            );
            const qualifyMarkets = match.markets.filter((market) => market.type === "TO_QUALIFY");
            const bttsMarkets = match.markets.filter((market) => market.type === "BOTH_TEAMS_TO_SCORE");
            const cardsMatrixMarkets = match.markets.filter((market) => market.type === "CARDS_MATRIX");
            const cornersMatrixMarkets = match.markets.filter((market) => market.type === "CORNERS_MATRIX");
            const regularMarkets = match.markets.filter(
              (market) =>
                !market.type.startsWith("OVER_UNDER_") &&
                market.type !== "ONE_X_TWO" &&
                market.type !== "DOUBLE_CHANCE" &&
                market.type !== "HALF_TIME_ONE_X_TWO" &&
                market.type !== "HALF_TIME_FULL_TIME" &&
                market.type !== "EXACT_SCORE" &&
                market.type !== "TO_QUALIFY" &&
                market.type !== "BOTH_TEAMS_TO_SCORE" &&
                market.type !== "CARDS_MATRIX" &&
                market.type !== "CORNERS_MATRIX",
            );
            const profiBudgetEmpty = remainingBudget < 1;

            return (
              <article key={match.id} className="rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
              <button
                type="button"
                onClick={() => toggleMatchExpansion(match.id)}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {match.homeTeam} vs. {match.awayTeam}
                    </h2>
                    {variant === "einfach" && localSimpleTipByMatch[match.id] ? (
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Tipp abgegeben: {localSimpleTipByMatch[match.id]}
                      </span>
                    ) : null}
                    {variant === "profi" ? (
                      <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-900">
                        Verfügbare Punkte: {remainingBudget}
                      </span>
                    ) : null}
                  </div>
                  {variant === "profi" && localSimpleTipByMatch[match.id] ? (
                    <p className="mt-2 max-w-xl text-left text-xs font-medium leading-snug text-amber-900">
                      Du hast hier schon einen Ergebnistipp in der Billo-Variante gesetzt (
                      {localSimpleTipByMatch[match.id]}).
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-zinc-600">
                    Anstoß: {new Date(match.startsAt).toLocaleString("de-DE")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Spielbudget: {remainingBudget}/{totalBudget} Punkte verbleibend {match.isKnockout ? "(KO)" : ""}
                  </p>
                </div>
                <span className="text-sm font-medium text-zinc-600">
                  {expandedMatchIds.includes(match.id) ? "Ausblenden" : "Quoten anzeigen"}
                </span>
              </button>

              {expandedMatchIds.includes(match.id) ? (
                <div className="mt-4 space-y-3">
                  {variant === "einfach" ? (
                    <section className="rounded-md border p-4">
                      {(() => {
                        const hasSimpleTip = Boolean(localSimpleTipByMatch[match.id]);
                        return (
                          <>
                      <h3 className="font-semibold">Billo-Variante: Ergebnistipp</h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        Gib nur das Endergebnis ein. Intern werden automatisch {simpleOneXTwoStake} Punkte auf 1X2 und{" "}
                        {simpleExactStake} Punkte auf Exact Score gesetzt.
                      </p>
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div>
                          <label className="block text-xs text-zinc-600">{match.homeTeam}</label>
                          <input
                            type="number"
                            min={0}
                            disabled={hasSimpleTip}
                            value={(simpleTipInputs[match.id]?.home ?? "")}
                            onChange={(event) =>
                              setSimpleTipInputs((current) => ({
                                ...current,
                                [match.id]: {
                                  home: event.target.value,
                                  away: current[match.id]?.away ?? "",
                                  saving: current[match.id]?.saving ?? false,
                                },
                              }))
                            }
                            className="w-20 rounded-md border border-zinc-300 px-2 py-1 disabled:cursor-not-allowed disabled:bg-zinc-100"
                          />
                        </div>
                        <span className="pb-2 font-semibold">:</span>
                        <div>
                          <label className="block text-xs text-zinc-600">{match.awayTeam}</label>
                          <input
                            type="number"
                            min={0}
                            disabled={hasSimpleTip}
                            value={(simpleTipInputs[match.id]?.away ?? "")}
                            onChange={(event) =>
                              setSimpleTipInputs((current) => ({
                                ...current,
                                [match.id]: {
                                  home: current[match.id]?.home ?? "",
                                  away: event.target.value,
                                  saving: current[match.id]?.saving ?? false,
                                },
                              }))
                            }
                            className="w-20 rounded-md border border-zinc-300 px-2 py-1 disabled:cursor-not-allowed disabled:bg-zinc-100"
                          />
                        </div>
                        <p className="pb-2 text-sm font-medium text-zinc-700">Auto-Einsatz: {simpleTotalStake} Punkte</p>
                        <button
                          type="button"
                          disabled={
                            !isAuthenticated ||
                            (simpleTipInputs[match.id]?.saving ?? false) ||
                            hasSimpleTip ||
                            remainingBudget < simpleTotalStake
                          }
                          onClick={() => placeSimpleTip(match.id)}
                          className="cursor-pointer rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {hasSimpleTip
                            ? "Bereits getippt"
                            : remainingBudget < simpleTotalStake
                              ? "Budget verbraucht"
                            : (simpleTipInputs[match.id]?.saving ?? false)
                              ? "Speichert..."
                              : "Tipp platzieren"}
                        </button>
                        {simpleSuccessByMatch[match.id] ? (
                          <p className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-sm text-emerald-800">
                            {simpleSuccessByMatch[match.id]}
                          </p>
                        ) : null}
                      </div>
                          </>
                        );
                      })()}
                    </section>
                  ) : null}

                  {variant === "profi" ? (
                    <>
                  {combinedOutcomeMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">1X2 / Doppelte Chance</h3>
                      <div className="mt-3 space-y-3">
                        {combinedOutcomeMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-zinc-50 p-3">
                            <p className="text-sm font-medium text-zinc-700">{market.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-3">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) || profiBudgetEmpty;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      !isAuthenticated ||
                                      oddsViolateMinimumForMarket(market.type, option.odds) ||
                                      (pickBlocked && !isSelected)
                                    }
                                    onClick={() =>
                                      toggleSelection({
                                        matchId: match.id,
                                        matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                        marketTitle: market.title,
                                        marketType: market.type,
                                        optionId: option.id,
                                        outcome: option.outcome,
                                        odds: option.odds,
                                      })
                                    }
                                    className={`rounded-md border p-2 text-left ${
                                      isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                    } ${
                                      isAuthenticated &&
                                      !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                      (!pickBlocked || isSelected)
                                        ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                        : "cursor-not-allowed opacity-70"
                                    }`}
                                  >
                                    <p className="text-sm text-zinc-700">{option.outcome}</p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {qualifyMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Qualifiziert sich</h3>
                      <p className="mt-1 text-xs text-zinc-600">
                        Wer zieht nach dem eingetragenen Ergebnis in die nächste Runde ein (K.-o.).
                      </p>
                      <div className="mt-3 space-y-3">
                        {qualifyMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-white p-3">
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                  profiBudgetEmpty;
                                const label =
                                  option.outcome === "1"
                                    ? `${match.homeTeam} (1)`
                                    : option.outcome === "2"
                                      ? `${match.awayTeam} (2)`
                                      : option.outcome;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      !isAuthenticated ||
                                      oddsViolateMinimumForMarket(market.type, option.odds) ||
                                      (pickBlocked && !isSelected)
                                    }
                                    onClick={() =>
                                      toggleSelection({
                                        matchId: match.id,
                                        matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                        marketTitle: market.title,
                                        marketType: market.type,
                                        optionId: option.id,
                                        outcome: option.outcome,
                                        odds: option.odds,
                                      })
                                    }
                                    className={`rounded-md border p-2 text-left ${
                                      isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                    } ${
                                      isAuthenticated &&
                                      !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                      (!pickBlocked || isSelected)
                                        ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                        : "cursor-not-allowed opacity-70"
                                    }`}
                                  >
                                    <p className="text-sm text-zinc-700">{label}</p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {bttsMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Beide Teams treffen</h3>
                      <div className="mt-3 space-y-3">
                        {bttsMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-zinc-50 p-3">
                            <p className="text-sm font-medium text-zinc-700">{market.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-3">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) || profiBudgetEmpty;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      !isAuthenticated ||
                                      oddsViolateMinimumForMarket(market.type, option.odds) ||
                                      (pickBlocked && !isSelected)
                                    }
                                    onClick={() =>
                                      toggleSelection({
                                        matchId: match.id,
                                        matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                        marketTitle: market.title,
                                        marketType: market.type,
                                        optionId: option.id,
                                        outcome: option.outcome,
                                        odds: option.odds,
                                      })
                                    }
                                    className={`rounded-md border p-2 text-left ${
                                      isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                    } ${
                                      isAuthenticated &&
                                      !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                      (!pickBlocked || isSelected)
                                        ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                        : "cursor-not-allowed opacity-70"
                                    }`}
                                  >
                                    <p className="text-sm text-zinc-700">{option.outcome}</p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {goalMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Über / Unter Tore</h3>
                      <div className="mt-3 space-y-3">
                        {goalMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-zinc-50 p-3">
                            <p className="text-sm font-medium text-zinc-700">{market.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) || profiBudgetEmpty;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      !isAuthenticated ||
                                      oddsViolateMinimumForMarket(market.type, option.odds) ||
                                      (pickBlocked && !isSelected)
                                    }
                                    onClick={() =>
                                      toggleSelection({
                                        matchId: match.id,
                                        matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                        marketTitle: market.title,
                                        marketType: market.type,
                                        optionId: option.id,
                                        outcome: option.outcome,
                                        odds: option.odds,
                                      })
                                    }
                                    className={`rounded-md border p-2 text-left ${
                                      isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                    } ${
                                      isAuthenticated &&
                                      !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                      (!pickBlocked || isSelected)
                                        ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                        : "cursor-not-allowed opacity-70"
                                    }`}
                                  >
                                    <p className="text-sm text-zinc-700">{option.outcome}</p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {halfTimeOneXTwoMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Halbzeit 1X2</h3>
                      <div className="mt-3 space-y-3">
                        {halfTimeOneXTwoMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-zinc-50 p-3">
                            <p className="text-sm font-medium text-zinc-700">{market.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-3">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) || profiBudgetEmpty;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      !isAuthenticated ||
                                      oddsViolateMinimumForMarket(market.type, option.odds) ||
                                      (pickBlocked && !isSelected)
                                    }
                                    onClick={() =>
                                      toggleSelection({
                                        matchId: match.id,
                                        matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                        marketTitle: market.title,
                                        marketType: market.type,
                                        optionId: option.id,
                                        outcome: option.outcome,
                                        odds: option.odds,
                                      })
                                    }
                                    className={`rounded-md border p-2 text-left ${
                                      isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                    } ${
                                      isAuthenticated &&
                                      !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                      (!pickBlocked || isSelected)
                                        ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                        : "cursor-not-allowed opacity-70"
                                    }`}
                                  >
                                    <p className="text-sm text-zinc-700">{option.outcome}</p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {halfTimeFullTimeMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Halbzeit / Endstand</h3>
                      <div className="mt-3 space-y-3">
                        {halfTimeFullTimeMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-zinc-50 p-3">
                            <p className="text-sm font-medium text-zinc-700">{market.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-3">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) || profiBudgetEmpty;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      !isAuthenticated ||
                                      oddsViolateMinimumForMarket(market.type, option.odds) ||
                                      (pickBlocked && !isSelected)
                                    }
                                    onClick={() =>
                                      toggleSelection({
                                        matchId: match.id,
                                        matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                        marketTitle: market.title,
                                        marketType: market.type,
                                        optionId: option.id,
                                        outcome: option.outcome,
                                        odds: option.odds,
                                      })
                                    }
                                    className={`rounded-md border p-2 text-left ${
                                      isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                    } ${
                                      isAuthenticated &&
                                      !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                      (!pickBlocked || isSelected)
                                        ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                        : "cursor-not-allowed opacity-70"
                                    }`}
                                  >
                                    <p className="text-sm text-zinc-700">{option.outcome}</p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {cornersMatrixMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Ecken</h3>
                      <p className="mt-1 text-xs text-zinc-600">
                        Gesamtzahl Eckbälle – Auswertung wie vom Spielbetreiber eingetragen. Zeile 0 ohne „Unter“.
                      </p>
                      <div className="mt-3 space-y-4">
                        {cornersMatrixMarkets.map((market) => {
                          const byOutcome = new Map(market.options.map((o) => [o.outcome, o]));
                          const thresholds = cornersMatrixThresholdsFromOutcomes(
                            market.options.map((o) => o.outcome),
                          );
                          const rows = thresholds.map((n) => ({
                            n,
                            unter: byOutcome.get(`CORNERS:U:${n}`),
                            exakt: byOutcome.get(`CORNERS:E:${n}`),
                            uber: byOutcome.get(`CORNERS:O:${n}`),
                          }));
                          return (
                            <div key={market.id} className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
                              <table className="w-full min-w-[28rem] border-collapse text-sm">
                                <thead>
                                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                                    <th className="px-2 py-2 font-semibold">N</th>
                                    <th className="px-2 py-2 font-semibold">Unter</th>
                                    <th className="px-2 py-2 font-semibold">Exakt</th>
                                    <th className="px-2 py-2 font-semibold">Über</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row) => (
                                    <tr key={row.n} className="border-b border-zinc-100">
                                      <td className="px-2 py-1.5 font-medium tabular-nums">{row.n}</td>
                                      {(["unter", "exakt", "uber"] as const).map((col) => {
                                        const option = row[col];
                                        if (!option) {
                                          return (
                                            <td key={col} className="px-1 py-1">
                                              –
                                            </td>
                                          );
                                        }
                                        const isSelected = selections.some((item) => item.optionId === option.id);
                                        const pickBlocked =
                                          isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                          profiBudgetEmpty;
                                        return (
                                          <td key={col} className="px-1 py-1 align-top">
                                            <button
                                              type="button"
                                              disabled={
                                                !isAuthenticated ||
                                                oddsViolateMinimumForMarket(market.type, option.odds) ||
                                                (pickBlocked && !isSelected)
                                              }
                                              onClick={() =>
                                                toggleSelection({
                                                  matchId: match.id,
                                                  matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                                  marketTitle: market.title,
                                                  marketType: market.type,
                                                  optionId: option.id,
                                                  outcome: option.outcome,
                                                  odds: option.odds,
                                                })
                                              }
                                              title={formatCornersMatrixOutcomeLabel(option.outcome)}
                                              className={`w-full min-h-[3rem] rounded-md border px-2 py-1.5 text-left ${
                                                isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                              } ${
                                                isAuthenticated &&
                                                !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                                (!pickBlocked || isSelected)
                                                  ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                                  : "cursor-not-allowed opacity-70"
                                              }`}
                                            >
                                              <p className="text-lg font-semibold leading-tight text-blue-700">
                                                {option.odds.toFixed(2)}
                                              </p>
                                            </button>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {cardsMatrixMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Karten</h3>
                      <p className="mt-1 text-xs text-zinc-600">
                        Gesamtzahl Karten – Auswertung wie vom Spielbetreiber eingetragen. Bei kleinster Schwelle N = 0
                        kein „Unter“ in dieser Zeile.
                      </p>
                      <div className="mt-3 space-y-4">
                        {cardsMatrixMarkets.map((market) => {
                          const byOutcome = new Map(market.options.map((o) => [o.outcome, o]));
                          const thresholds = cardsMatrixThresholdsFromOutcomes(
                            market.options.map((o) => o.outcome),
                          );
                          const rows = thresholds.map((n) => ({
                            n,
                            unter: byOutcome.get(`CARDS:U:${n}`),
                            exakt: byOutcome.get(`CARDS:E:${n}`),
                            uber: byOutcome.get(`CARDS:O:${n}`),
                          }));
                          return (
                            <div key={market.id} className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
                              <table className="w-full min-w-[28rem] border-collapse text-sm">
                                <thead>
                                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                                    <th className="px-2 py-2 font-semibold">N</th>
                                    <th className="px-2 py-2 font-semibold">Unter</th>
                                    <th className="px-2 py-2 font-semibold">Exakt</th>
                                    <th className="px-2 py-2 font-semibold">Über</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row) => (
                                    <tr key={row.n} className="border-b border-zinc-100">
                                      <td className="px-2 py-1.5 font-medium tabular-nums">{row.n}</td>
                                      {(["unter", "exakt", "uber"] as const).map((col) => {
                                        const option = row[col];
                                        if (!option) {
                                          return (
                                            <td key={col} className="px-1 py-1">
                                              –
                                            </td>
                                          );
                                        }
                                        const isSelected = selections.some((item) => item.optionId === option.id);
                                        const pickBlocked =
                                          isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                          profiBudgetEmpty;
                                        return (
                                          <td key={col} className="px-1 py-1 align-top">
                                            <button
                                              type="button"
                                              disabled={
                                                !isAuthenticated ||
                                                oddsViolateMinimumForMarket(market.type, option.odds) ||
                                                (pickBlocked && !isSelected)
                                              }
                                              onClick={() =>
                                                toggleSelection({
                                                  matchId: match.id,
                                                  matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                                  marketTitle: market.title,
                                                  marketType: market.type,
                                                  optionId: option.id,
                                                  outcome: option.outcome,
                                                  odds: option.odds,
                                                })
                                              }
                                              title={formatCardsMatrixOutcomeLabel(option.outcome)}
                                              className={`w-full min-h-[3rem] rounded-md border px-2 py-1.5 text-left ${
                                                isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                              } ${
                                                isAuthenticated &&
                                                !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                                (!pickBlocked || isSelected)
                                                  ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                                  : "cursor-not-allowed opacity-70"
                                              }`}
                                            >
                                              <p className="text-lg font-semibold leading-tight text-blue-700">
                                                {option.odds.toFixed(2)}
                                              </p>
                                            </button>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {regularMarkets.map((market) => (
                    <section key={market.id} className="rounded-md border p-3">
                      <h3 className="font-semibold">{market.title}</h3>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        {market.options.map((option) => {
                          const isSelected = selections.some((item) => item.optionId === option.id);
                          const pickBlocked =
                            isProfiOptionBlocked(match.id, market.type, option.outcome) || profiBudgetEmpty;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={
                                !isAuthenticated ||
                                oddsViolateMinimumForMarket(market.type, option.odds) ||
                                (pickBlocked && !isSelected)
                              }
                              onClick={() =>
                                toggleSelection({
                                  matchId: match.id,
                                  matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                  marketTitle: market.title,
                                  marketType: market.type,
                                  optionId: option.id,
                                  outcome: option.outcome,
                                  odds: option.odds,
                                })
                              }
                              className={`rounded-md border p-2 text-left ${
                                isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-zinc-50"
                              } ${
                                isAuthenticated &&
                                !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                (!pickBlocked || isSelected)
                                  ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                  : "cursor-not-allowed opacity-70"
                              }`}
                            >
                              <p className="text-sm text-zinc-700">{option.outcome}</p>
                              <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {exactScoreMarkets.length > 0 ? (
                    <section className="rounded-md border p-3">
                      <h3 className="font-semibold">Exact Score (0:0 bis 3:3)</h3>
                      <p className="mt-1 text-xs text-zinc-600">
                        <strong>X:X</strong> steht für <strong>exakt 3:3</strong> und für <strong>jedes andere</strong>{" "}
                        Ergebnis außerhalb der Matrix 0:0–3:3.
                      </p>
                      <div className="mt-3 space-y-3">
                        {exactScoreMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-zinc-50 p-3">
                            <p className="text-sm font-medium text-zinc-700">{market.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-4">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) || profiBudgetEmpty;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      !isAuthenticated ||
                                      oddsViolateMinimumForMarket(market.type, option.odds) ||
                                      (pickBlocked && !isSelected)
                                    }
                                    onClick={() =>
                                      toggleSelection({
                                        matchId: match.id,
                                        matchLabel: `${match.homeTeam} vs. ${match.awayTeam}`,
                                        marketTitle: market.title,
                                        marketType: market.type,
                                        optionId: option.id,
                                        outcome: option.outcome,
                                        odds: option.odds,
                                      })
                                    }
                                    className={`rounded-md border p-2 text-left ${
                                      isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                                    } ${
                                      isAuthenticated &&
                                      !oddsViolateMinimumForMarket(market.type, option.odds) &&
                                      (!pickBlocked || isSelected)
                                        ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70"
                                        : "cursor-not-allowed opacity-70"
                                    }`}
                                  >
                                    <p className="text-sm text-zinc-700">{option.outcome}</p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}
            </article>
            );
          })}
        </div>
      )}

      {!isAuthenticated ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Zum Platzieren einer Wette bitte zuerst einloggen.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setIsSlipOpen((current) => !current)}
        className="fixed bottom-4 right-4 z-40 cursor-pointer rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        Wettschein ({selections.length})
      </button>

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-white p-5 text-zinc-900 shadow-2xl transition-transform duration-200 ${
          isSlipOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Wettschein</h3>
          <button
            type="button"
            onClick={() => setIsSlipOpen(false)}
            className="cursor-pointer rounded-md border px-2 py-1 text-sm"
          >
            Schließen
          </button>
        </div>

        {selections.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">Keine Auswahl. Klicke auf ein Quotenfeld.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {selections.map((selection) => (
              <li key={selection.optionId} className="rounded-md border p-3">
                <p className="text-sm text-zinc-600">{selection.matchLabel}</p>
                <p className="font-medium">
                  {selection.marketTitle}: {selection.outcome}
                </p>
                <p className="text-sm">Quote: {selection.odds.toFixed(2)}</p>
                <button
                  type="button"
                  onClick={() =>
                    setSelections((current) => current.filter((item) => item.optionId !== selection.optionId))
                  }
                  className="mt-2 cursor-pointer text-sm text-red-700 underline"
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="mt-5 space-y-3 border-t pt-4" onSubmit={placeBet}>
          <label className="block text-sm font-medium">Einsatz (Punkte)</label>
          <input
            type="number"
            min={1}
            max={maxStakeForSelectedBet || 1}
            step={1}
            value={stake}
            onChange={(event) => setStake(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <p className="text-sm">
            Quote: <span className="font-semibold">{combinedOdds.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            Möglicher Nettogewinn (Punktekonto):{" "}
            <span className="font-semibold">{possibleWin.toFixed(2)} Punkte</span>
          </p>
          <p className="text-xs text-zinc-600">
            Verbleibendes Budget im gewählten Spiel: {remainingBudgetForSelectedMatch} Punkte
          </p>
          <p className="text-xs text-zinc-600">
            Maximaler Einsatz für diese Quote (Gewinnlimit pro Tipp): {maxStakeForSelectedBet} Punkte
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message && placedBetInfo ? (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <p className="font-semibold">Folgende Wette wurde erfolgreich platziert:</p>
              <p className="mt-1">
                {placedBetInfo.matchLabel} - {placedBetInfo.marketTitle}: {placedBetInfo.outcome} @{" "}
                {placedBetInfo.odds.toFixed(2)}
              </p>
              <p>Einsatz: {placedBetInfo.stake} Punkte</p>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={saving || selections.length === 0 || !canSubmitStake}
            className="w-full cursor-pointer rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Speichern..." : "Einsatz bestätigen"}
          </button>
          <section
            className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/90 px-4 py-3 text-zinc-800"
            aria-label="Regeln und Limits"
          >
            <h4 className="border-b border-zinc-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Limits & Regeln
            </h4>
            <dl className="mt-3 space-y-0 text-sm">
              <div className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-2 first:pt-0">
                <dt className="text-zinc-600">Spielbudget</dt>
                <dd className="shrink-0 tabular-nums font-medium text-zinc-900">
                  {selectedMatch?.isKnockout ? KO_MATCH_BET_BUDGET : LEAGUE_MATCH_BET_BUDGET}{" "}
                  <span className="font-normal text-zinc-500">P.</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-2">
                <dt className="text-zinc-600">Gewinn max. pro Tipp</dt>
                <dd className="shrink-0 tabular-nums font-medium text-zinc-900">
                  {maxPayoutPerBet} <span className="font-normal text-zinc-500">P.</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-zinc-600">Gewinn max. pro Spiel</dt>
                <dd className="shrink-0 tabular-nums font-medium text-zinc-900">
                  {maxPayoutPerMatch} <span className="font-normal text-zinc-500">P.</span>
                </dd>
              </div>
            </dl>
            <p className="mt-1 text-[11px] leading-snug text-zinc-500">
              Ungenutztes Spielbudget verfällt.
            </p>
            <ul className="mt-4 space-y-2 border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-700">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-zinc-400" aria-hidden>
                  –
                </span>
                <span>
                  Quoten {"<="} {MIN_BETTABLE_ODDS.toFixed(2).replace(".", ",")} sind gesperrt (Ausnahme: Markt{" "}
                  <strong>1X2</strong> – dort sind alle Quoten wählbar).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-zinc-400" aria-hidden>
                  –
                </span>
                <span>Nur Einzelwetten (keine Kombis).</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-zinc-400" aria-hidden>
                  –
                </span>
                <span>
                  Profi: Beliebig viele Einzelwetten pro Spiel, solange noch Spielbudget übrig ist; die Summe aller
                  Einsätze darf das Budget nicht überschreiten.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-zinc-400" aria-hidden>
                  –
                </span>
                <span className="text-zinc-600">
                  Keine vollständige Absicherung: Kombinationen aus offenen Tipps im selben Spiel, die jedes mögliche
                  Ergebnis abdecken würden (z.&nbsp;B. Über/Unter dieselbe Linie, oder 1X2 mit passender Doppelter
                  Chance), sind nicht erlaubt.
                </span>
              </li>
            </ul>
          </section>
        </form>
      </aside>
    </>
  );
}
