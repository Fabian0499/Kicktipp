"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Login fehlgeschlagen.");
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
      <form className="w-full rounded-xl border bg-white p-6 text-zinc-900 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold text-zinc-900">Login</h1>
        <p className="mt-1 text-sm text-zinc-600">Willkommen zurück.</p>

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
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full cursor-pointer rounded-md bg-black px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Einloggen..." : "Einloggen"}
        </button>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-black underline">
            Passwort vergessen?
          </Link>
          <Link href="/register" className="text-black underline">
            Jetzt registrieren
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">Lade...</main>}>
      <LoginPageContent />
    </Suspense>
  );
}
