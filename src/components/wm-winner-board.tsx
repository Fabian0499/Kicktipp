"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLocale, useT } from "@/components/locale-provider";
import { WmWinnerFlag } from "@/components/wm-winner-flag";
import {
  WM_WINNER_STAKE,
  wmWinnerDisplayFromStoredLabel,
  wmWinnerDisplayLabel,
} from "@/lib/wm-winner";

type OptionRow = {
  id: string;
  label: string;
  odds: number;
  isField: boolean;
  sortOrder: number;
};

export function WmWinnerBoard({
  initialSettledAt,
  initialAcceptingTips,
  initialOptions,
  initialUserPick,
  isAuthenticated,
}: {
  initialSettledAt: string | null;
  initialAcceptingTips: boolean;
  initialOptions: OptionRow[];
  initialUserPick: {
    optionId: string;
    label: string;
    oddsSnapshot: number;
    stake: number;
    createdAt: string;
  } | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const [options] = useState(initialOptions);
  const [userPick, setUserPick] = useState(initialUserPick);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dateLocale = locale === "en" ? "en-GB" : "de-DE";

  const favorites = options.filter((option) => !option.isField);
  const fieldOption = options.find((option) => option.isField);
  const selectedOption = selectedId ? options.find((option) => option.id === selectedId) : null;

  function selectOption(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      setIsSlipOpen(false);
      setError("");
      return;
    }

    setSelectedId(id);
    setIsSlipOpen(true);
    setError("");
  }

  async function submitPick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) {
      return;
    }
    setSaving(true);
    setError("");
    const response = await fetch("/api/wm-winner/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: selectedId }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? t("wm.saveFailed"));
      setSaving(false);
      return;
    }
    const chosen = options.find((option) => option.id === selectedId);
    setUserPick(
      chosen
        ? {
            optionId: chosen.id,
            label: chosen.label,
            oddsSnapshot: chosen.odds,
            stake: WM_WINNER_STAKE,
            createdAt: new Date().toISOString(),
          }
        : null,
    );
    setSelectedId(null);
    setSaving(false);
    setIsSlipOpen(false);
    router.refresh();
  }

  const possibleWin = selectedOption ? Math.round(WM_WINNER_STAKE * selectedOption.odds) : 0;

  const showBettingUi = !userPick && initialAcceptingTips && isAuthenticated;

  return (
    <div className="space-y-8">
      {initialSettledAt ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {t("wm.settledOn").replace(
            "{date}",
            new Date(initialSettledAt).toLocaleString(dateLocale, { dateStyle: "medium" }),
          )}
        </p>
      ) : null}

      {userPick ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-zinc-900">
          <p className="font-semibold text-blue-950">{t("wm.yourPick")}</p>
          <p className="mt-1 flex w-full flex-wrap items-center justify-between gap-3 text-lg">
            <span className="flex min-w-0 items-center gap-3">
              <WmWinnerFlag storedLabel={userPick.label} size="lg" />
              <span className="min-w-0">{wmWinnerDisplayFromStoredLabel(userPick.label, locale)}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-blue-800">
              {userPick.oddsSnapshot.toFixed(2)}
            </span>
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {t("wm.stakeSubmitted")
              .replace("{stake}", String(userPick.stake))
              .replace(
                "{date}",
                new Date(userPick.createdAt).toLocaleString(dateLocale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              )}
          </p>
        </div>
      ) : null}

      {showBettingUi ? (
        <div className="space-y-4">
          <section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...favorites, ...(fieldOption ? [fieldOption] : [])].map((option) => {
                const active = selectedId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectOption(option.id)}
                    className={`cursor-pointer rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/40"
                        : "border-white/30 bg-white/95 hover:border-blue-400 hover:bg-blue-50/70"
                    }`}
                  >
                    <span className="flex w-full min-w-0 items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3 font-medium text-zinc-900">
                        <WmWinnerFlag option={option} size="lg" />
                        <span className="min-w-0">{wmWinnerDisplayLabel(option, locale)}</span>
                      </span>
                      <span className="shrink-0 text-lg font-semibold tabular-nums text-blue-700">
                        {option.odds.toFixed(2)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldOption ? (
              <p className="mt-3 max-w-2xl text-xs text-white/85">{t("wm.piratesHint")}</p>
            ) : null}
          </section>
        </div>
      ) : null}

      {!userPick && initialAcceptingTips && !isAuthenticated ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("wm.loginRequired")}
        </p>
      ) : null}

      {!userPick && !initialAcceptingTips ? (
        <p className="rounded-md border border-zinc-300 bg-white/90 px-4 py-3 text-sm text-zinc-800">
          {t("wm.closedNoNewTips")}
        </p>
      ) : null}

      {showBettingUi ? (
        <>
          <button
            type="button"
            onClick={() => setIsSlipOpen((current) => !current)}
            className="fixed bottom-4 right-4 z-40 cursor-pointer rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            {t("wm.betSlip")} ({selectedId ? 1 : 0})
          </button>

          <aside
            className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-white p-5 text-zinc-900 shadow-2xl transition-transform duration-200 ${
              isSlipOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{t("wm.betSlip")}</h3>
              <button
                type="button"
                onClick={() => setIsSlipOpen(false)}
                className="cursor-pointer rounded-md border px-2 py-1 text-sm"
              >
                {t("wm.close")}
              </button>
            </div>

            {!selectedOption ? (
              <p className="mt-4 text-sm text-zinc-600">{t("wm.slipEmpty")}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                <li className="rounded-md border p-3">
                  <p className="text-sm text-zinc-600">{t("wm.title")}</p>
                  <p className="mt-1 flex w-full min-w-0 items-center justify-between gap-3 font-medium">
                    <span className="flex min-w-0 items-center gap-3">
                      <WmWinnerFlag option={selectedOption} size="lg" />
                      <span className="min-w-0">{wmWinnerDisplayLabel(selectedOption, locale)}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-zinc-700">
                      {t("wm.oddsValue").replace("{odds}", selectedOption.odds.toFixed(2))}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="mt-2 cursor-pointer text-sm text-red-700 underline"
                  >
                    {t("wm.removeSelection")}
                  </button>
                </li>
              </ul>
            )}

            <form className="mt-5 space-y-3 border-t pt-4" onSubmit={submitPick}>
              <p className="text-sm font-medium">{t("wm.stakeHeading")}</p>
              <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                {t("wm.stakeNote").replace("{stake}", String(WM_WINNER_STAKE))}
              </p>
              <p className="text-sm">
                {t("wm.oddsLabel")}:{" "}
                <span className="font-semibold">{selectedOption?.odds.toFixed(2) ?? "–"}</span>
              </p>
              <p className="text-sm">
                {t("wm.possiblePayout")}:{" "}
                <span className="font-semibold">
                  {selectedOption
                    ? t("wm.possiblePayoutValue").replace("{points}", String(possibleWin))
                    : "–"}
                </span>
              </p>
              <p className="text-xs text-zinc-600">{t("wm.payoutNote")}</p>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={!selectedId || saving}
                className="w-full cursor-pointer rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t("wm.saving") : t("wm.confirm")}
              </button>
            </form>
          </aside>
        </>
      ) : null}
    </div>
  );
}
