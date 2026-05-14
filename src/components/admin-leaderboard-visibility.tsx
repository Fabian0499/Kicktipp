"use client";

import { useState } from "react";
import { usePersistedDetailsOpen } from "@/hooks/use-persisted-details-open";

const STORAGE_KEY = "kicktipp-admin-leaderboard-visibility-details-open";

type UserRow = {
  id: string;
  label: string;
  hiddenFromLeaderboard: boolean;
};

export function AdminLeaderboardVisibility({ users }: { users: UserRow[] }) {
  const { open: detailsOpen, onToggle: onDetailsToggle } = usePersistedDetailsOpen(STORAGE_KEY, true);
  const [rows, setRows] = useState(users);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function setHidden(userId: string, hiddenFromLeaderboard: boolean) {
    setBusyId(userId);
    setError("");
    const response = await fetch(`/api/admin/users/${userId}/leaderboard-visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiddenFromLeaderboard }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Speichern fehlgeschlagen.");
      setBusyId(null);
      return;
    }
    setRows((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, hiddenFromLeaderboard } : u)),
    );
    setBusyId(null);
  }

  return (
    <details
      className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
      open={detailsOpen}
      onToggle={onDetailsToggle}
    >
      <summary className="cursor-pointer text-xl font-semibold text-zinc-900">
        Rangliste: Sichtbarkeit
      </summary>
      <p className="mt-2 text-sm text-zinc-600">
        Ausgeblendete Nutzer erscheinen temporär nicht in der öffentlichen Rangliste. Punkte und Tipps bleiben
        unverändert; es betrifft nur die Anzeige.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <ul className="mt-4 max-h-[min(24rem,50vh)] divide-y divide-zinc-200 overflow-y-auto rounded-md border border-zinc-200">
        {rows.length === 0 ? (
          <li className="p-3 text-sm text-zinc-600">Keine Benutzer vorhanden.</li>
        ) : (
          rows.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
              <span className="min-w-0 flex-1 break-words font-medium text-zinc-900">{u.label}</span>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-zinc-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-400"
                  checked={u.hiddenFromLeaderboard}
                  disabled={busyId === u.id}
                  onChange={(e) => void setHidden(u.id, e.target.checked)}
                />
                <span>In Rangliste ausblenden</span>
              </label>
            </li>
          ))
        )}
      </ul>
    </details>
  );
}
