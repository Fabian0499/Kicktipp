"use client";

import { useState } from "react";

type PendingUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

export function AdminUserApprovals({ users }: { users: PendingUser[] }) {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function approveUser(userId: string) {
    setApprovingId(userId);
    setError("");

    const response = await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Freigabe fehlgeschlagen.");
      setApprovingId(null);
      return;
    }

    window.location.reload();
  }

  return (
    <section className="mt-8 rounded-xl border bg-white p-6 text-zinc-900 shadow-sm">
      <h2 className="text-xl font-semibold">Nutzer-Freigaben</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Neu registrierte Nutzer müssen hier freigegeben werden, bevor sie sich einloggen können.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-zinc-600">Aktuell keine ausstehenden Freigaben.</p>
        ) : (
          users.map((user) => (
            <article key={user.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-zinc-600">{user.email}</p>
                <p className="text-xs text-zinc-500">Registriert: {new Date(user.createdAt).toLocaleString("de-DE")}</p>
              </div>
              <button
                type="button"
                disabled={approvingId === user.id}
                onClick={() => approveUser(user.id)}
                className="cursor-pointer rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approvingId === user.id ? "Freigabe..." : "Freigeben"}
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
