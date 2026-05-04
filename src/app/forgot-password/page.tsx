"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
    };

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    setMessage("Wenn die E-Mail existiert, wurde ein Reset-Link versendet.");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
      <form className="w-full rounded-xl border bg-white p-6 text-zinc-900 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold text-zinc-900">Passwort zurücksetzen</h1>
        <p className="mt-1 text-sm text-zinc-600">Wir senden dir einen Link zum Zurücksetzen.</p>

        <label className="mt-4 block text-sm font-medium text-zinc-900">E-Mail</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-black px-4 py-2.5 text-white disabled:opacity-60"
        >
          {loading ? "Wird gesendet..." : "Reset-Link senden"}
        </button>
      </form>
    </main>
  );
}
