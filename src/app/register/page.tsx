"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData(form);
    const payload = {
      username: String(formData.get("username") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setMessage("Registrierung erfolgreich. Dein Konto wird nach Admin-Freigabe aktiviert.");
    form.reset();
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 1500);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
      <form className="w-full rounded-xl border bg-white p-6 text-zinc-900 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold text-zinc-900">Konto erstellen</h1>
        <p className="mt-1 text-sm text-zinc-600">Du startest mit 0 Punkten und gewinnst durch richtige Tipps.</p>

        <label className="mt-4 block text-sm font-medium text-zinc-900">Benutzername</label>
        <input
          name="username"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        <label className="mt-4 block text-sm font-medium text-zinc-900">Name</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        <label className="mt-4 block text-sm font-medium text-zinc-900">E-Mail</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        <label className="mt-4 block text-sm font-medium text-zinc-900">Passwort</label>
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
          className="mt-5 w-full cursor-pointer rounded-md bg-black px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Wird erstellt..." : "Registrieren"}
        </button>
        <p className="mt-4 text-sm text-zinc-600">
          Bereits registriert?{" "}
          <Link href="/login" className="font-medium text-black underline">
            Hier einloggen
          </Link>
        </p>
      </form>
    </main>
  );
}
