"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePersistedDetailsOpen } from "@/hooks/use-persisted-details-open";
import { WmWinnerFlag } from "@/components/wm-winner-flag";
import { wmWinnerDisplayLabel } from "@/lib/wm-winner";

const WM_SIEGER_DETAILS_STORAGE_KEY = "kicktipp-admin-wm-sieger-details-open";

type OptionRow = {
  id: string;
  label: string;
  odds: number;
  isField: boolean;
  sortOrder: number;
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminWmWinner({
  closesAtIso,
  settledAtIso,
  winnerOptionId,
  options,
}: {
  closesAtIso: string;
  settledAtIso: string | null;
  winnerOptionId: string | null;
  options: OptionRow[];
}) {
  const [closesLocal, setClosesLocal] = useState(() => toDatetimeLocalValue(closesAtIso));
  const [oddsById, setOddsById] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((option) => [option.id, String(option.odds)])),
  );
  const [winnerId, setWinnerId] = useState(winnerOptionId ?? "");
  const [loading, setLoading] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { open: detailsOpen, onToggle: onDetailsToggle } = usePersistedDetailsOpen(
    WM_SIEGER_DETAILS_STORAGE_KEY,
    true,
  );

  const settled = Boolean(settledAtIso);

  const oddsPayload = useMemo(
    () =>
      options.map((option) => ({
        id: option.id,
        odds: Number(oddsById[option.id] ?? option.odds),
      })),
    [options, oddsById],
  );

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const closesAt = new Date(closesLocal).toISOString();
    const response = await fetch("/api/admin/wm-winner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        closesAt,
        options: oddsPayload,
      }),
    });
    setLoading(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setMessage("Quoten und Abgabefrist wurden gespeichert.");
  }

  async function settle() {
    if (!winnerId) {
      setError("Bitte Siegermannschaft wählen.");
      return;
    }
    setSettleLoading(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/wm-winner/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winningOptionId: winnerId }),
    });
    setSettleLoading(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Auswertung fehlgeschlagen.");
      return;
    }
    setMessage("WM-Wette wurde ausgewertet.");
    window.location.reload();
  }

  return (
    <details
      className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
      open={detailsOpen}
      onToggle={onDetailsToggle}
    >
      <summary className="cursor-pointer text-xl font-semibold text-zinc-900">
        WM Sieger 2026 – Quoten &amp; Auswertung
      </summary>

      <form className="mt-6 space-y-4" onSubmit={saveSettings}>
        <div>
          <label className="block text-sm font-medium">Abgabefrist (lokal)</label>
          <input
            type="datetime-local"
            value={closesLocal}
            onChange={(event) => setClosesLocal(event.target.value)}
            disabled={settled}
            className="mt-1 w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 disabled:bg-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500">Tipps sind nur bis zu diesem Zeitpunkt möglich (vor Turnierbeginn).</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Mannschaft</th>
                <th className="py-2">Quote</th>
              </tr>
            </thead>
            <tbody>
              {options.map((option) => (
                <tr key={option.id} className="border-b border-zinc-100">
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-3">
                      <WmWinnerFlag option={option} />
                      <span>{wmWinnerDisplayLabel(option)}</span>
                    </span>
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      min={1.01}
                      max={1000}
                      value={oddsById[option.id] ?? ""}
                      onChange={(event) =>
                        setOddsById((current) => ({ ...current, [option.id]: event.target.value }))
                      }
                      disabled={settled}
                      className="w-28 rounded-md border border-zinc-300 px-2 py-1 disabled:bg-zinc-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          disabled={loading || settled}
          className="rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Speichern…" : "Quoten & Frist speichern"}
        </button>
      </form>

      <div className="mt-8 border-t border-zinc-200 pt-6">
        <h4 className="font-semibold text-zinc-900">Auswertung nach Turnierende</h4>
        <p className="mt-1 text-sm text-zinc-600">
          Wähle die Mannschaft, die Weltmeister wurde. Gewinner erhalten Gewinn = Einsatz × Quote (max. Auszahlung
          begrenzt).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium">Siegermannschaft</label>
            <select
              value={winnerId}
              onChange={(event) => setWinnerId(event.target.value)}
              disabled={settled}
              className="mt-1 min-w-[14rem] rounded-md border border-zinc-300 px-3 py-2 disabled:bg-zinc-100"
            >
              <option value="">– bitte wählen –</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {wmWinnerDisplayLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={settled || settleLoading || !winnerId}
            onClick={() => void settle()}
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 disabled:opacity-50"
          >
            {settled ? "Bereits ausgewertet" : settleLoading ? "Auswerten…" : "Endgültig auswerten"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
    </details>
  );
}
