"use client";

import { FormEvent, useState } from "react";
import { usePersistedDetailsOpen } from "@/hooks/use-persisted-details-open";

const POINTS_ADJUSTMENT_DETAILS_STORAGE_KEY = "kicktipp-admin-points-adjustment-details-open";

type UserItem = {
  id: string;
  label: string;
  balance: number;
};

export function AdminPointsAdjustment({ users }: { users: UserItem[] }) {
  const { open: detailsOpen, onToggle: onDetailsToggle } = usePersistedDetailsOpen(
    POINTS_ADJUSTMENT_DETAILS_STORAGE_KEY,
    true,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      userId: String(formData.get("userId") ?? ""),
      mode: String(formData.get("mode") ?? ""),
      amount: Number(formData.get("amount")),
      reason: String(formData.get("reason") ?? ""),
    };

    const response = await fetch("/api/admin/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Korrektur konnte nicht gespeichert werden.");
      setLoading(false);
      return;
    }

    setMessage("Punkte wurden erfolgreich angepasst.");
    setLoading(false);
    form.reset();
    window.location.reload();
  }

  return (
    <details
      className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
      open={detailsOpen}
      onToggle={onDetailsToggle}
    >
      <summary className="cursor-pointer text-xl font-semibold text-zinc-900">
        Punkte manuell anpassen
      </summary>
      <p className="mt-2 text-sm text-zinc-600">
        Für Supportfälle kannst du hier Punkte gutschreiben oder abziehen.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium">Benutzer</label>
          <select
            name="userId"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            defaultValue=""
          >
            <option value="" disabled>
              Benutzer auswählen
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.label} ({user.balance} Punkte)
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Aktion</label>
            <select
              name="mode"
              required
              defaultValue="credit"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            >
              <option value="credit">Punkte gutschreiben</option>
              <option value="debit">Punkte abziehen</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Punkte</label>
            <input
              name="amount"
              type="number"
              min={1}
              max={5000}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Grund</label>
          <input
            name="reason"
            required
            placeholder="z. B. technische Korrektur Spieltag 4"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer rounded-md bg-black px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Speichert..." : "Punkte verbuchen"}
        </button>
      </form>
    </details>
  );
}
