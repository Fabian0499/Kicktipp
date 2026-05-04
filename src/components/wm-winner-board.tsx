"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { WM_WINNER_STAKE } from "@/lib/wm-winner";

type OptionRow = {
  id: string;
  label: string;
  odds: number;
  isField: boolean;
  sortOrder: number;
};

export function WmWinnerBoard({
  initialTitle,
  initialClosesAt,
  initialSettledAt,
  initialAcceptingTips,
  initialOptions,
  initialUserPick,
  isAuthenticated,
}: {
  initialTitle: string;
  initialClosesAt: string;
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
  const [options] = useState(initialOptions);
  const [userPick, setUserPick] = useState(initialUserPick);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const favorites = options.filter((option) => !option.isField);
  const fieldOption = options.find((option) => option.isField);
  const selectedOption = selectedId ? options.find((option) => option.id === selectedId) : null;

  function selectOption(id: string) {
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
      setError(body?.error ?? "Tipp konnte nicht gespeichert werden.");
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

  const closesLabel = new Date(initialClosesAt).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const possibleWin = selectedOption ? Math.round(WM_WINNER_STAKE * selectedOption.odds) : 0;

  const showBettingUi = !userPick && initialAcceptingTips && isAuthenticated;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-white/20 bg-white/95 p-6 text-zinc-900 shadow-sm">
        <h2 className="text-xl font-semibold">{initialTitle}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Pro Teilnehmer ein Tipp mit <strong>{WM_WINNER_STAKE} Punkten</strong> Einsatz für diese Sonderwette – die Punkte
          stehen dir <strong>einmal</strong> zur Verfügung, sobald du noch keinen WM-Tipp abgegeben hast ({" "}
          <strong>ohne Abzug</strong> vom Punktekonto-Guthaben). Abgabe nur <strong>vor Turnierbeginn</strong> – letzte
          Frist: {closesLabel}
        </p>
        {initialSettledAt ? (
          <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Diese Wette wurde ausgewertet (Stand:{" "}
            {new Date(initialSettledAt).toLocaleString("de-DE", { dateStyle: "medium" })}).
          </p>
        ) : null}
      </div>

      {userPick ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-zinc-900">
          <p className="font-semibold text-blue-950">Dein Tipp</p>
          <p className="mt-1 text-lg">
            {userPick.label} @ {userPick.oddsSnapshot.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Einsatz: {userPick.stake} Punkte · abgegeben am{" "}
            {new Date(userPick.createdAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      ) : null}

      {showBettingUi ? (
        <div className="space-y-4">
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/90">Top-Favoriten</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((option) => {
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
                    <p className="font-medium text-zinc-900">{option.label}</p>
                    <p className="mt-1 text-lg font-semibold text-blue-700">{option.odds.toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {fieldOption ? (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/90">Alle anderen</h3>
              <button
                type="button"
                onClick={() => selectOption(fieldOption.id)}
                className={`w-full cursor-pointer rounded-lg border p-4 text-left transition sm:max-w-md ${
                  selectedId === fieldOption.id
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/40"
                    : "border-white/30 bg-white/95 hover:border-blue-400 hover:bg-blue-50/70"
                }`}
              >
                <p className="font-medium text-zinc-900">{fieldOption.label}</p>
                <p className="mt-1 text-lg font-semibold text-blue-700">{fieldOption.odds.toFixed(2)}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Gewinner kommt aus einer anderen Nation als die oben genannten Favoriten.
                </p>
              </button>
            </section>
          ) : null}
        </div>
      ) : null}

      {!userPick && initialAcceptingTips && !isAuthenticated ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bitte einloggen, um einen Tipp abzugeben.
        </p>
      ) : null}

      {!userPick && !initialAcceptingTips ? (
        <p className="rounded-md border border-zinc-300 bg-white/90 px-4 py-3 text-sm text-zinc-800">
          Die Abgabefrist ist vorbei – es sind keine neuen Tipps mehr möglich.
        </p>
      ) : null}

      {showBettingUi ? (
        <>
          <button
            type="button"
            onClick={() => setIsSlipOpen((current) => !current)}
            className="fixed bottom-4 right-4 z-40 cursor-pointer rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            Wettschein ({selectedId ? 1 : 0})
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

            {!selectedOption ? (
              <p className="mt-4 text-sm text-zinc-600">Keine Auswahl. Klicke auf eine Mannschaft oder „Alle anderen“.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                <li className="rounded-md border p-3">
                  <p className="text-sm text-zinc-600">WM Sieger 2026</p>
                  <p className="font-medium">{selectedOption.label}</p>
                  <p className="text-sm">Quote: {selectedOption.odds.toFixed(2)}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="mt-2 cursor-pointer text-sm text-red-700 underline"
                  >
                    Auswahl entfernen
                  </button>
                </li>
              </ul>
            )}

            <form className="mt-5 space-y-3 border-t pt-4" onSubmit={submitPick}>
              <p className="text-sm font-medium">Einsatz</p>
              <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                {WM_WINNER_STAKE} Punkte (Sonderkontingent, kein Abzug vom Konto)
              </p>
              <p className="text-sm">
                Quote: <span className="font-semibold">{selectedOption?.odds.toFixed(2) ?? "–"}</span>
              </p>
              <p className="text-sm">
                Möglicher Gewinn (unkappt):{" "}
                <span className="font-semibold">{selectedOption ? `${possibleWin} Punkte` : "–"}</span>
              </p>
              <p className="text-xs text-zinc-600">
                Auszahlung nach Auswertung mit Obergrenze gemäß Regeln.
              </p>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={!selectedId || saving}
                className="w-full cursor-pointer rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Speichern…" : "Auswahl bestätigen"}
              </button>
            </form>
          </aside>
        </>
      ) : null}
    </div>
  );
}
