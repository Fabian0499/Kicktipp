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
import {
  formatGoalsMatrixOutcomeLabel,
  goalsMatrixThresholdsFromOutcomes,
} from "@/lib/goals-market";
import {
  formatHandicapMatrixOutcomeLabel,
  handicapMatrixLinesFromOutcomes,
} from "@/lib/handicap-market";
import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { payoutFromGrossReturn } from "@/lib/bet-payout";
import { profiBetConflictsOpenSet } from "@/lib/betting-conflicts";
import { MIN_BETTABLE_ODDS, oddsViolateMinimumForMarket } from "@/lib/min-bettable-odds";
import { parseBilloSimpleTipInput } from "@/lib/simple-tip";
import {
  QUALIFY_OUTCOME_ET_AWAY,
  QUALIFY_OUTCOME_ET_HOME,
  QUALIFY_OUTCOME_PEN_AWAY,
  QUALIFY_OUTCOME_PEN_HOME,
  qualifyMarketUsesMethodMatrix,
} from "@/lib/to-qualify-method";
import {
  EXACT_SCORE_AWAY_WINS,
  EXACT_SCORE_CATCH_ALL_LABEL,
  EXACT_SCORE_DRAWS,
  EXACT_SCORE_HOME_WINS,
  EXACT_SCORE_ORDERED_OUTCOMES,
  sortExactScoreMarketOptions,
} from "@/lib/exact-score";
import { formatHalfTimeFullTimeDisplayLabel, formatOneXTwoDisplayLabel } from "@/lib/one-x-two-display";
import { useLocale, useT } from "@/components/locale-provider";
import { displayTeamName } from "@/lib/team-display-names";
import { profiMarketCategoryKey } from "@/lib/profi-market-category";

const LEAGUE_MATCH_BET_BUDGET = 100;
const KO_MATCH_BET_BUDGET = 200;
const LEAGUE_MAX_PAYOUT_PER_BET = 400;
const KO_MAX_PAYOUT_PER_BET = 600;
const LEAGUE_MAX_PAYOUT_PER_MATCH = 600;
const KO_MAX_PAYOUT_PER_MATCH = 900;
const BETS_VARIANT_STORAGE_KEY = "kicktipp-bets-variant";

const COUNTRY_FLAG_ISO: Record<string, string> = {
  Mexiko: "mx",
  "Südafrika": "za",
  "Republik Korea": "kr",
  Tschechien: "cz",
  Kanada: "ca",
  "Bosnien und Herzegowina": "ba",
  Katar: "qa",
  Schweiz: "ch",
  Brasilien: "br",
  Marokko: "ma",
  Haiti: "ht",
  Schottland: "gb-sct",
  USA: "us",
  Paraguay: "py",
  Australien: "au",
  "Türkei": "tr",
  Deutschland: "de",
  "Curaçao": "cw",
  "Elfenbeinküste": "ci",
  Ecuador: "ec",
  Niederlande: "nl",
  Japan: "jp",
  Schweden: "se",
  Tunesien: "tn",
  Belgien: "be",
  "Ägypten": "eg",
  "IR Iran": "ir",
  Neuseeland: "nz",
  Spanien: "es",
  "Kap Verde": "cv",
  "Saudi-Arabien": "sa",
  Uruguay: "uy",
  Frankreich: "fr",
  Senegal: "sn",
  Irak: "iq",
  Norwegen: "no",
  Argentinien: "ar",
  Algerien: "dz",
  "Österreich": "at",
  Jordanien: "jo",
  Portugal: "pt",
  "DR Kongo": "cd",
  Usbekistan: "uz",
  Kolumbien: "co",
  England: "gb",
  Kroatien: "hr",
  Ghana: "gh",
  Panama: "pa",
};

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
  groupCode: string | null;
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
  marketType: string;
  outcome: string;
  odds: number;
  stake: number;
};

function flagIsoForTeam(team: string): string | null {
  const normalized = team.trim();
  return COUNTRY_FLAG_ISO[normalized] ?? null;
}

function displayOutcomeLabel(
  marketType: string,
  outcome: string,
  homeLabel?: string,
  awayLabel?: string,
  drawLabel = "Unentschieden",
): string {
  if (marketType === "ONE_X_TWO") {
    return formatOneXTwoDisplayLabel(outcome, homeLabel ?? "", awayLabel ?? "", drawLabel);
  }
  if (marketType === "HALF_TIME_FULL_TIME") {
    return formatHalfTimeFullTimeDisplayLabel(outcome, homeLabel ?? "", awayLabel ?? "", drawLabel);
  }
  if (marketType === "HANDICAP_MATRIX") {
    return formatHandicapMatrixOutcomeLabel(outcome, homeLabel, awayLabel);
  }
  if (marketType === "GOALS_MATRIX") {
    return formatGoalsMatrixOutcomeLabel(outcome);
  }
  return outcome;
}

function teamLabelsFromMatchLabel(matchLabel: string): [string | undefined, string | undefined] {
  const [homeLabel, awayLabel] = matchLabel.split(" vs. ");
  return [homeLabel || undefined, awayLabel || undefined];
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-400 bg-white text-[10px] font-bold leading-none text-zinc-700"
      >
        ?
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 whitespace-pre-line rounded-md border border-zinc-200 bg-white p-2 text-xs font-normal leading-snug text-zinc-800 shadow-lg group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

export function BetsBoard({
  matches,
  isAuthenticated,
  currentUserId,
  existingSimpleTipByMatch,
  openProfiBetsByMatch,
  usedStakeByMatch,
  allocatedBudgetByMatch,
}: {
  matches: Match[];
  isAuthenticated: boolean;
  currentUserId: string | null;
  existingSimpleTipByMatch: Record<string, string>;
  openProfiBetsByMatch: Record<string, Array<{ marketType: string; outcomeLabel: string }>>;
  usedStakeByMatch: Record<string, number>;
  allocatedBudgetByMatch: Record<string, number>;
}) {
  const [variant, setVariant] = useState<"profi" | "einfach">("einfach");
  const [variantLoaded, setVariantLoaded] = useState(false);
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
  const { locale } = useLocale();
  const t = useT();
  const drawLabel = t("common.draw");

  useEffect(() => {
    setLocalOpenProfiBetsByMatch(openProfiBetsByMatch);
  }, [openProfiBetsByMatch]);

  useEffect(() => {
    const storageKey = currentUserId ? `${BETS_VARIANT_STORAGE_KEY}:${currentUserId}` : BETS_VARIANT_STORAGE_KEY;
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "einfach" || saved === "profi") {
      setVariant(saved);
    } else {
      setVariant("einfach");
    }
    setVariantLoaded(true);
  }, [currentUserId]);

  useEffect(() => {
    if (!variantLoaded) {
      return;
    }
    const storageKey = currentUserId ? `${BETS_VARIANT_STORAGE_KEY}:${currentUserId}` : BETS_VARIANT_STORAGE_KEY;
    window.localStorage.setItem(storageKey, variant);
  }, [currentUserId, variant, variantLoaded]);

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

  function isProfiCategoryAlreadyUsed(matchId: string, marketType: string): boolean {
    const key = profiMarketCategoryKey(marketType);
    const open = localOpenProfiBetsByMatch[matchId] ?? [];
    return open.some((b) => profiMarketCategoryKey(b.marketType) === key);
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
    return payoutFromGrossReturn(cappedReturn);
  }, [stake, combinedOdds, maxPayoutPerBet]);

  const displayMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aCode = a.groupCode ?? "ZZ";
      const bCode = b.groupCode ?? "ZZ";
      if (aCode !== bCode) {
        return aCode.localeCompare(bCode);
      }
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [matches]);

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
    if (pending && isProfiCategoryAlreadyUsed(pending.matchId, pending.marketType)) {
      setError(
        "Für dieses Spiel hast du bereits einen offenen Tipp in dieser Wett-Kategorie (z. B. zählen alle Über-/Unter-Tore als eine Kategorie). Pro Spiel ist nur ein offener Tipp pro Kategorie erlaubt.",
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
            marketType: placedSelection.marketType,
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
    setSelections((current) => {
      if (current.some((item) => item.optionId === selection.optionId)) {
        setIsSlipOpen(false);
        return current.filter((item) => item.optionId !== selection.optionId);
      }
      setIsSlipOpen(true);
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
    const parsed = parseBilloSimpleTipInput(input.home, input.away);
    if (!parsed) {
      setError(t("bets.simpleTipScoreRequired"));
      return;
    }
    const { predictedHome, predictedAway } = parsed;
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
      setError(body?.error ?? t("bets.simpleTipSaveFailed"));
      setSimpleTipInputs((current) => ({
        ...current,
        [matchId]: {
          ...input,
          saving: false,
        },
      }));
      return;
    }

    setMessage(t("bets.simpleTipSavedMessage"));
    setSimpleSuccessByMatch((current) => ({
      ...current,
      [matchId]: t("bets.simpleTipSuccessBanner"),
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
          <p>{t("bets.noEvents")}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex w-fit rounded-md border bg-white p-1 text-sm text-zinc-900">
            <button
              type="button"
              onClick={() => setVariant("einfach")}
              className={`cursor-pointer rounded px-3 py-1.5 ${variant === "einfach" ? "bg-black text-white" : ""}`}
            >
              {t("bets.billoVariant")}
            </button>
            <button
              type="button"
              onClick={() => setVariant("profi")}
              className={`cursor-pointer rounded px-3 py-1.5 ${variant === "profi" ? "bg-black text-white" : ""}`}
            >
              {t("bets.profiVariant")}
            </button>
          </div>
          {displayMatches.map((match, index) => {
            const totalBudget = allocatedBudgetByMatch[match.id] ?? (match.isKnockout ? KO_MATCH_BET_BUDGET : LEAGUE_MATCH_BET_BUDGET);
            const usedStake = localUsedStakeByMatch[match.id] ?? 0;
            const remainingBudget = Math.max(0, totalBudget - usedStake);
            const simpleOneXTwoStake = match.isKnockout ? 140 : 80;
            const simpleExactStake = match.isKnockout ? 60 : 20;
            const simpleTotalStake = simpleOneXTwoStake + simpleExactStake;
            const goalMarkets = match.markets.filter((market) => market.type.startsWith("OVER_UNDER_"));
            const goalsMatrixMarkets = match.markets.filter((market) => market.type === "GOALS_MATRIX");
            const halfTimeFullTimeMarkets = match.markets.filter(
              (market) => market.type === "HALF_TIME_FULL_TIME",
            );
            const exactScoreMarkets = match.markets.filter((market) => market.type === "EXACT_SCORE");
            const combinedOutcomeMarkets = match.markets.filter((market) => market.type === "ONE_X_TWO");
            const qualifyMarkets = match.markets.filter((market) => market.type === "TO_QUALIFY");
            const bttsMarkets = match.markets.filter((market) => market.type === "BOTH_TEAMS_TO_SCORE");
            const handicapMatrixMarkets = match.markets.filter((market) => market.type === "HANDICAP_MATRIX");
            const cardsMatrixMarkets = match.markets.filter((market) => market.type === "CARDS_MATRIX");
            const cornersMatrixMarkets = match.markets.filter((market) => market.type === "CORNERS_MATRIX");
            const regularMarkets = match.markets.filter(
              (market) =>
                !market.type.startsWith("OVER_UNDER_") &&
                market.type !== "GOALS_MATRIX" &&
                market.type !== "ONE_X_TWO" &&
                market.type !== "DOUBLE_CHANCE" &&
                market.type !== "HALF_TIME_ONE_X_TWO" &&
                market.type !== "HALF_TIME_FULL_TIME" &&
                market.type !== "EXACT_SCORE" &&
                market.type !== "TO_QUALIFY" &&
                market.type !== "BOTH_TEAMS_TO_SCORE" &&
                market.type !== "HANDICAP_MATRIX" &&
                market.type !== "CARDS_MATRIX" &&
                market.type !== "CORNERS_MATRIX",
            );
            const profiBudgetEmpty = remainingBudget < 1;
            const previous = index > 0 ? displayMatches[index - 1] : null;
            const showGroupHeader = match.groupCode !== (previous?.groupCode ?? null);
            const groupHeading = match.groupCode
              ? `${t("bets.groupPrefix")} ${match.groupCode}`
              : t("bets.otherGames");
            const homeTeamLabel = displayTeamName(match.homeTeam, locale);
            const awayTeamLabel = displayTeamName(match.awayTeam, locale);
            const matchVsLabel = `${homeTeamLabel} vs. ${awayTeamLabel}`;

            const isExpanded = variant === "einfach" || expandedMatchIds.includes(match.id);

            return (
              <Fragment key={match.id}>
              {showGroupHeader ? (
                <h2 className="pt-2 text-xl font-bold text-white">{groupHeading}</h2>
              ) : null}
              <div className={variant === "einfach" ? "rounded-xl border bg-white p-6 text-zinc-900 shadow-sm" : ""}>
              <article
                className={
                  variant === "profi"
                    ? "min-h-[9rem] cursor-pointer rounded-xl border bg-white p-6 text-zinc-900 shadow-sm"
                    : "text-zinc-900"
                }
                onClick={variant === "profi" ? () => toggleMatchExpansion(match.id) : undefined}
                onKeyDown={
                  variant === "profi"
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleMatchExpansion(match.id);
                        }
                      }
                    : undefined
                }
                role={variant === "profi" ? "button" : undefined}
                tabIndex={variant === "profi" ? 0 : undefined}
                aria-expanded={variant === "profi" ? isExpanded : undefined}
              >
              <div className="flex w-full items-center justify-between text-left">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-2">
                          {flagIsoForTeam(match.homeTeam) ? (
                            <img
                              src={`https://flagcdn.com/w40/${flagIsoForTeam(match.homeTeam)}.png`}
                              alt=""
                              className="h-5 w-7 rounded-sm object-cover ring-1 ring-zinc-300"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          {homeTeamLabel}
                        </span>
                        <span>vs.</span>
                        <span className="flex items-center gap-2">
                          {flagIsoForTeam(match.awayTeam) ? (
                            <img
                              src={`https://flagcdn.com/w40/${flagIsoForTeam(match.awayTeam)}.png`}
                              alt=""
                              className="h-5 w-7 rounded-sm object-cover ring-1 ring-zinc-300"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          {awayTeamLabel}
                        </span>
                      </span>
                    </h2>
                    {variant === "profi" ? (
                      <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-900">
                        {t("bets.availablePoints")}: {remainingBudget}
                      </span>
                    ) : null}
                  </div>
                  {variant === "profi" && localSimpleTipByMatch[match.id] ? (
                    <p className="mt-2 max-w-xl text-left text-xs font-medium leading-snug text-amber-900">
                      {t("bets.billoTipAlreadySet").replace("{score}", localSimpleTipByMatch[match.id])}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-zinc-600">
                    {t("dashboard.kickoff")}:{" "}
                    {new Date(match.startsAt).toLocaleString(locale === "en" ? "en-GB" : "de-DE")}
                  </p>
                </div>
                {variant === "profi" ? (
                  <span className="text-sm font-medium text-zinc-600">
                    {expandedMatchIds.includes(match.id) ? t("bets.hideOdds") : t("bets.showOdds")}
                  </span>
                ) : null}
              </div>
              </article>

              {isExpanded ? (
                <div className={variant === "einfach" ? "mt-4 space-y-3" : "mt-3 space-y-3"}>
                  {variant === "einfach" ? (
                    <section className="rounded-md border bg-white p-4">
                      {(() => {
                        const hasSimpleTip = Boolean(localSimpleTipByMatch[match.id]);
                        const simpleHome = simpleTipInputs[match.id]?.home ?? "";
                        const simpleAway = simpleTipInputs[match.id]?.away ?? "";
                        const canPlaceSimpleTip = parseBilloSimpleTipInput(simpleHome, simpleAway) !== null;
                        return (
                          <>
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div>
                          <label className="block text-xs text-zinc-600">
                            <span className="flex items-center gap-1.5">
                              {flagIsoForTeam(match.homeTeam) ? (
                                <img
                                  src={`https://flagcdn.com/w20/${flagIsoForTeam(match.homeTeam)}.png`}
                                  alt=""
                                  className="h-3.5 w-5 rounded-[2px] object-cover ring-1 ring-zinc-300"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : null}
                              {homeTeamLabel}
                            </span>
                          </label>
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
                          <label className="block text-xs text-zinc-600">
                            <span className="flex items-center gap-1.5">
                              {flagIsoForTeam(match.awayTeam) ? (
                                <img
                                  src={`https://flagcdn.com/w20/${flagIsoForTeam(match.awayTeam)}.png`}
                                  alt=""
                                  className="h-3.5 w-5 rounded-[2px] object-cover ring-1 ring-zinc-300"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : null}
                              {awayTeamLabel}
                            </span>
                          </label>
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
                        <button
                          type="button"
                          disabled={
                            !isAuthenticated ||
                            (simpleTipInputs[match.id]?.saving ?? false) ||
                            hasSimpleTip ||
                            !canPlaceSimpleTip ||
                            remainingBudget < simpleTotalStake
                          }
                          onClick={() => placeSimpleTip(match.id)}
                          className="cursor-pointer rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {hasSimpleTip
                            ? t("bets.alreadyTipped")
                            : remainingBudget < simpleTotalStake
                              ? t("bets.budgetUsed")
                            : (simpleTipInputs[match.id]?.saving ?? false)
                              ? t("bets.saving")
                              : t("bets.placeSimpleTip")}
                        </button>
                        {hasSimpleTip ? (
                          <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-base font-semibold text-blue-900">
                            {t("bets.simpleTipPlaced").replace("{score}", localSimpleTipByMatch[match.id])}
                          </p>
                        ) : null}
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
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.category1x2")}
                        <InfoTooltip text={t("bets.tooltip1x2")} />
                      </h3>
                      <div className="mt-3 space-y-3">
                        {combinedOutcomeMarkets.map((market) => (
                          <div key={market.id} className="grid gap-2 md:grid-cols-3">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                  isProfiCategoryAlreadyUsed(match.id, market.type) ||
                                  profiBudgetEmpty;
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
                                        matchLabel: matchVsLabel,
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
                                    <p className="text-sm text-zinc-700">
                                      {formatOneXTwoDisplayLabel(option.outcome, homeTeamLabel, awayTeamLabel, drawLabel)}
                                    </p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {qualifyMarkets.length > 0 ? (
                    <div className="space-y-3">
                      {qualifyMarkets.map((market) => {
                        const byOutcome = new Map(market.options.map((o) => [o.outcome, o]));
                        const isMethodMatrix = qualifyMarketUsesMethodMatrix(market.options);

                        const renderPick = (rowKey: string, option: Option | undefined) => {
                          if (!option) {
                            return (
                              <td key={`missing-${rowKey}`} className="px-1 py-1">
                                <span className="text-zinc-400">–</span>
                              </td>
                            );
                          }
                          const isSelected = selections.some((item) => item.optionId === option.id);
                          const pickBlocked =
                            isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                            isProfiCategoryAlreadyUsed(match.id, market.type) ||
                            profiBudgetEmpty;
                          return (
                            <td key={option.id} className="px-1 py-1 align-top">
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
                                    matchLabel: matchVsLabel,
                                    marketTitle: market.title,
                                    marketType: market.type,
                                    optionId: option.id,
                                    outcome: option.outcome,
                                    odds: option.odds,
                                  })
                                }
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
                        };

                        if (isMethodMatrix) {
                          return (
                            <section key={market.id} className="rounded-md border bg-white p-3">
                              <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                                {t("bets.categoryQualifyMethod")}
                                <InfoTooltip text={t("bets.tooltipQualifyMethod")} />
                              </h3>
                              <div className="mt-3 overflow-x-auto rounded-md border border-zinc-200 bg-white">
                                <table className="w-full min-w-[22rem] border-collapse text-sm">
                                  <thead>
                                    <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                                      <th className="px-2 py-2 font-semibold text-black"> </th>
                                      <th className="px-2 py-2 font-semibold text-black">{homeTeamLabel}</th>
                                      <th className="px-2 py-2 font-semibold text-black">{awayTeamLabel}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-zinc-100">
                                      <th className="px-2 py-2 text-left font-medium text-zinc-800">
                                        {t("bets.qualifyMethodEt")}
                                      </th>
                                      {renderPick("et-home", byOutcome.get(QUALIFY_OUTCOME_ET_HOME))}
                                      {renderPick("et-away", byOutcome.get(QUALIFY_OUTCOME_ET_AWAY))}
                                    </tr>
                                    <tr className="border-b border-zinc-100">
                                      <th className="px-2 py-2 text-left font-medium text-zinc-800">
                                        {t("bets.qualifyMethodPen")}
                                      </th>
                                      {renderPick("pen-home", byOutcome.get(QUALIFY_OUTCOME_PEN_HOME))}
                                      {renderPick("pen-away", byOutcome.get(QUALIFY_OUTCOME_PEN_AWAY))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </section>
                          );
                        }

                        return (
                          <section key={market.id} className="rounded-md border bg-white p-3">
                            <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                              {t("bets.categoryQualify")}
                              <InfoTooltip text={t("bets.tooltipQualify")} />
                            </h3>
                            <p className="mt-1 text-xs text-zinc-600">{t("bets.qualifySubtitle")}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                  isProfiCategoryAlreadyUsed(match.id, market.type) ||
                                  profiBudgetEmpty;
                                const label =
                                  option.outcome === "1"
                                    ? `${homeTeamLabel} (1)`
                                    : option.outcome === "2"
                                      ? `${awayTeamLabel} (2)`
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
                                        matchLabel: matchVsLabel,
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
                          </section>
                        );
                      })}
                    </div>
                  ) : null}

                  {bttsMarkets.length > 0 ? (
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.categoryBtts")}
                        <InfoTooltip text={t("bets.tooltipBtts")} />
                      </h3>
                      <div className="mt-3 space-y-3">
                        {bttsMarkets.map((market) => (
                          <div key={market.id} className="grid gap-2 md:grid-cols-3">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                  isProfiCategoryAlreadyUsed(match.id, market.type) ||
                                  profiBudgetEmpty;
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
                                        matchLabel: matchVsLabel,
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
                                    <p className="text-sm text-zinc-700">
                                      {option.outcome === "Ja"
                                        ? t("bets.optionJa")
                                        : option.outcome === "Nein"
                                          ? t("bets.optionNein")
                                          : option.outcome}
                                    </p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {halfTimeFullTimeMarkets.length > 0 ? (
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.categoryHtFt")}
                        <InfoTooltip text={t("bets.tooltipHtFt")} />
                      </h3>
                      <div className="mt-3 space-y-3">
                        {halfTimeFullTimeMarkets.map((market) => (
                          <div key={market.id} className="grid gap-2 md:grid-cols-3">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                  isProfiCategoryAlreadyUsed(match.id, market.type) ||
                                  profiBudgetEmpty;
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
                                        matchLabel: matchVsLabel,
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
                                    <p className="text-sm text-zinc-700">
                                      {formatHalfTimeFullTimeDisplayLabel(
                                        option.outcome,
                                        homeTeamLabel,
                                        awayTeamLabel,
                                        drawLabel,
                                      )}
                                    </p>
                                    <p className="text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                                  </button>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {cornersMatrixMarkets.length > 0 ? (
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.categoryCorners")}
                        <InfoTooltip text={t("bets.tooltipCorners")} />
                      </h3>
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
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.count")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.under")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.exact")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.over")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row) => (
                                    <tr key={row.n} className="border-b border-zinc-100">
                                      <td className="px-2 py-1.5 font-medium tabular-nums text-black">{row.n}</td>
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
                                          isProfiCategoryAlreadyUsed(match.id, market.type) ||
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
                                                  matchLabel: matchVsLabel,
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
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.categoryCards")}
                        <InfoTooltip text={t("bets.tooltipCards")} />
                      </h3>
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
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.count")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.under")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.exact")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.over")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row) => (
                                    <tr key={row.n} className="border-b border-zinc-100">
                                      <td className="px-2 py-1.5 font-medium tabular-nums text-black">{row.n}</td>
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
                                          isProfiCategoryAlreadyUsed(match.id, market.type) ||
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
                                                  matchLabel: matchVsLabel,
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
                    <section key={market.id} className="rounded-md border bg-white p-3">
                      <h3 className="font-semibold text-black">{market.title}</h3>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        {market.options.map((option) => {
                          const isSelected = selections.some((item) => item.optionId === option.id);
                          const pickBlocked =
                            isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                            isProfiCategoryAlreadyUsed(match.id, market.type) ||
                            profiBudgetEmpty;
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
                                  matchLabel: matchVsLabel,
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


                  {goalsMatrixMarkets.length > 0 || goalMarkets.length > 0 ? (
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.categoryGoals")}
                        <InfoTooltip text={t("bets.tooltipGoals")} />
                      </h3>
                      <div className="mt-3 space-y-4">
                        {goalsMatrixMarkets.map((market) => {
                          const byOutcome = new Map(market.options.map((o) => [o.outcome, o]));
                          const thresholds = goalsMatrixThresholdsFromOutcomes(
                            market.options.map((o) => o.outcome),
                          );
                          const rows = thresholds.map((n) => ({
                            n,
                            unter: byOutcome.get(`GOALS:U:${n}`),
                            exakt: byOutcome.get(`GOALS:E:${n}`),
                            uber: byOutcome.get(`GOALS:O:${n}`),
                          }));
                          return (
                            <div key={market.id} className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
                              <table className="w-full min-w-[28rem] border-collapse text-sm">
                                <thead>
                                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.goals")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.under")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.exact")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.over")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row) => (
                                    <tr key={row.n} className="border-b border-zinc-100">
                                      <td className="px-2 py-1.5 font-medium tabular-nums text-black">{row.n}</td>
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
                                          isProfiCategoryAlreadyUsed(match.id, market.type) ||
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
                                                  matchLabel: matchVsLabel,
                                                  marketTitle: market.title,
                                                  marketType: market.type,
                                                  optionId: option.id,
                                                  outcome: option.outcome,
                                                  odds: option.odds,
                                                })
                                              }
                                              title={formatGoalsMatrixOutcomeLabel(option.outcome)}
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
                        {goalMarkets.map((market) => (
                          <div key={market.id} className="rounded-md border bg-white p-3">
                            <p className="text-sm font-medium text-black">{market.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              {market.options.map((option) => {
                                const isSelected = selections.some((item) => item.optionId === option.id);
                                const pickBlocked =
                                  isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                  isProfiCategoryAlreadyUsed(match.id, market.type) ||
                                  profiBudgetEmpty;
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
                                        matchLabel: matchVsLabel,
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
                                    <p className="text-sm text-zinc-700">
                                      {option.outcome === "Ja"
                                        ? t("bets.optionJa")
                                        : option.outcome === "Nein"
                                          ? t("bets.optionNein")
                                          : option.outcome}
                                    </p>
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

                  {handicapMatrixMarkets.length > 0 ? (
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.categoryHandicap")}
                        <InfoTooltip text={t("bets.tooltipHandicap")} />
                      </h3>
                      <div className="mt-3 space-y-4">
                        {handicapMatrixMarkets.map((market) => {
                          const byOutcome = new Map(market.options.map((o) => [o.outcome, o]));
                          const handicapLines = handicapMatrixLinesFromOutcomes(market.options.map((o) => o.outcome));
                          return (
                            <div key={market.id} className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
                              <table className="w-full min-w-[28rem] border-collapse text-sm">
                                <thead>
                                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                                    <th className="px-2 py-2 font-semibold text-black">{t("common.handicap")}</th>
                                    <th className="px-2 py-2 font-semibold text-black">
                                      {t("common.home")} ({homeTeamLabel})
                                    </th>
                                    <th className="px-2 py-2 font-semibold text-black">{drawLabel}</th>
                                    <th className="px-2 py-2 font-semibold text-black">
                                      {t("common.away")} ({awayTeamLabel})
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {handicapLines.map((line) => (
                                    <tr
                                      key={`${line.homeHandicap}:${line.awayHandicap}`}
                                      className="border-b border-zinc-100"
                                    >
                                      <td className="px-2 py-1.5 font-medium tabular-nums text-black">
                                        {line.homeHandicap}:{line.awayHandicap}
                                      </td>
                                      {(["1", "X", "2"] as const).map((outcome) => {
                                        const option = byOutcome.get(
                                          `HANDICAP:${line.homeHandicap}:${line.awayHandicap}:${outcome}`,
                                        );
                                        if (!option) {
                                          return (
                                            <td key={outcome} className="px-1 py-1">
                                              –
                                            </td>
                                          );
                                        }
                                        const isSelected = selections.some((item) => item.optionId === option.id);
                                        const pickBlocked =
                                          isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                                          isProfiCategoryAlreadyUsed(match.id, market.type) ||
                                          profiBudgetEmpty;
                                        return (
                                          <td key={outcome} className="px-1 py-1 align-top">
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
                                                  matchLabel: matchVsLabel,
                                                  marketTitle: market.title,
                                                  marketType: market.type,
                                                  optionId: option.id,
                                                  outcome: option.outcome,
                                                  odds: option.odds,
                                                })
                                              }
                                              title={formatHandicapMatrixOutcomeLabel(
                                                option.outcome,
                                                homeTeamLabel,
                                                awayTeamLabel,
                                              )}
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

                  {exactScoreMarkets.length > 0 ? (
                    <section className="rounded-md border bg-white p-3">
                      <h3 className="inline-flex items-center gap-1.5 font-semibold text-black">
                        {t("bets.categoryExactScore")}
                        <InfoTooltip text={t("bets.tooltipExactScore")} />
                      </h3>
                      <div className="mt-3 space-y-3">
                        {exactScoreMarkets.map((market) => {
                          const byOutcome = new Map(market.options.map((o) => [o.outcome, o]));
                          const standardSet = new Set<string>(EXACT_SCORE_ORDERED_OUTCOMES);
                          const legacyOptions = market.options.filter(
                            (o) => !standardSet.has(o.outcome) && o.outcome !== EXACT_SCORE_CATCH_ALL_LABEL,
                          );

                          const renderOdd = (option: Option | undefined) => {
                            if (!option) {
                              return null;
                            }
                            const isSelected = selections.some((item) => item.optionId === option.id);
                            const pickBlocked =
                              isProfiOptionBlocked(match.id, market.type, option.outcome) ||
                              isProfiCategoryAlreadyUsed(match.id, market.type) ||
                              profiBudgetEmpty;
                            return (
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
                                    matchLabel: matchVsLabel,
                                    marketTitle: market.title,
                                    marketType: market.type,
                                    optionId: option.id,
                                    outcome: option.outcome,
                                    odds: option.odds,
                                  })
                                }
                                className={`w-full rounded-md border p-2 text-left ${
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
                          };

                          return (
                            <div key={market.id}>
                              <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                  <p className="border-b border-zinc-200 pb-2 text-center text-sm font-semibold text-black">
                                    {homeTeamLabel}
                                  </p>
                                  <div className="mt-2 space-y-2">
                                    {EXACT_SCORE_HOME_WINS.map((outcome) => (
                                      <Fragment key={outcome}>{renderOdd(byOutcome.get(outcome))}</Fragment>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="border-b border-zinc-200 pb-2 text-center text-sm font-semibold text-black">
                                    {drawLabel}
                                  </p>
                                  <div className="mt-2 space-y-2">
                                    {EXACT_SCORE_DRAWS.map((outcome) => (
                                      <Fragment key={outcome}>{renderOdd(byOutcome.get(outcome))}</Fragment>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="border-b border-zinc-200 pb-2 text-center text-sm font-semibold text-black">
                                    {awayTeamLabel}
                                  </p>
                                  <div className="mt-2 space-y-2">
                                    {EXACT_SCORE_AWAY_WINS.map((outcome) => (
                                      <Fragment key={outcome}>{renderOdd(byOutcome.get(outcome))}</Fragment>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {legacyOptions.length > 0 ? (
                                <div className="mt-4 border-t border-zinc-100 pt-3">
                                  <p className="mb-2 text-xs font-medium text-zinc-600">
                                    {t("bets.exactScoreMore")}
                                  </p>
                                  <div className="grid gap-2 sm:grid-cols-4">
                                    {sortExactScoreMarketOptions(legacyOptions).map((option) => (
                                      <Fragment key={option.id}>{renderOdd(option)}</Fragment>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}
              </div>
            </Fragment>
            );
          })}
        </div>
      )}

      {!isAuthenticated ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("bets.loginRequired")}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setIsSlipOpen((current) => !current)}
        className="fixed bottom-4 right-4 z-40 cursor-pointer rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {t("bets.betSlip")} ({selections.length})
      </button>

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-white p-5 text-zinc-900 shadow-2xl transition-transform duration-200 ${
          isSlipOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{t("bets.betSlip")}</h3>
          <button
            type="button"
            onClick={() => setIsSlipOpen(false)}
            className="cursor-pointer rounded-md border px-2 py-1 text-sm"
          >
            {t("bets.close")}
          </button>
        </div>

        {selections.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">{t("bets.slipEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {selections.map((selection) => (
              <li key={selection.optionId} className="rounded-md border p-3">
                <p className="text-sm text-zinc-600">{selection.matchLabel}</p>
                <p className="font-medium">
                  {selection.marketTitle}:{" "}
                  {displayOutcomeLabel(
                    selection.marketType,
                    selection.outcome,
                    ...teamLabelsFromMatchLabel(selection.matchLabel),
                    drawLabel,
                  )}
                </p>
                <p className="text-sm">
                  {t("bets.oddsLabel")}: {selection.odds.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setSelections((current) => current.filter((item) => item.optionId !== selection.optionId))
                  }
                  className="mt-2 cursor-pointer text-sm text-red-700 underline"
                >
                  {t("bets.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="mt-5 space-y-3 border-t pt-4" onSubmit={placeBet}>
          <label className="block text-sm font-medium">{t("bets.stakeLabel")}</label>
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
            {t("bets.oddsLabel")}: <span className="font-semibold">{combinedOdds.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            {t("bets.possiblePayout")}:{" "}
            <span className="font-semibold">
              {possibleWin.toFixed(2)} {t("common.points")}
            </span>
          </p>
          <p className="text-xs text-zinc-600">
            {t("bets.remainingBudget")}: {remainingBudgetForSelectedMatch} {t("common.points")}
          </p>
          <p className="text-xs text-zinc-600">
            {t("bets.maxStakeHint")}: {maxStakeForSelectedBet} {t("common.points")}
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message && placedBetInfo ? (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <p className="font-semibold">{t("bets.placeSuccessTitle")}</p>
              <p className="mt-1">
                {placedBetInfo.matchLabel} - {placedBetInfo.marketTitle}:{" "}
                {displayOutcomeLabel(
                  placedBetInfo.marketType,
                  placedBetInfo.outcome,
                  ...teamLabelsFromMatchLabel(placedBetInfo.matchLabel),
                )}{" "}
                @{" "}
                {placedBetInfo.odds.toFixed(2)}
              </p>
              <p>
                {t("dashboard.stake")}: {placedBetInfo.stake} {t("common.points")}
              </p>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={saving || selections.length === 0 || !canSubmitStake}
            className="w-full cursor-pointer rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t("bets.savingBet") : t("bets.confirmStake")}
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
                  Ergebnis abdecken würden (z.&nbsp;B. Über/Unter dieselbe Linie, oder alle drei 1X2-Ausgänge gleichzeitig),
                  sind nicht erlaubt.
                </span>
              </li>
            </ul>
          </section>
        </form>
      </aside>
    </>
  );
}
