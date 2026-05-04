"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      token: String(searchParams.get("token") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Passwort konnte nicht geändert werden.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setMessage("Passwort erfolgreich geändert. Du kannst dich nun einloggen.");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
      <form className="w-full rounded-xl border bg-white p-6 text-zinc-900 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold text-zinc-900">Neues Passwort setzen</h1>

        <label className="mt-4 block text-sm font-medium text-zinc-900">Neues Passwort</label>
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-black px-4 py-2.5 text-white disabled:opacity-60"
        >
          {loading ? "Speichern..." : "Passwort speichern"}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">Lade...</main>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
