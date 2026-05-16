"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useT } from "@/components/locale-provider";

function LoginPageContent() {
  const t = useT();
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
      setError(body?.error ?? t("login.failed"));
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
      <form className="w-full rounded-xl border bg-white p-7 text-zinc-900 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-3xl font-semibold text-zinc-900">{t("login.title")}</h1>
        <p className="mt-1 text-base text-zinc-600">{t("login.subtitle")}</p>

        <label className="mt-5 block text-base font-medium text-zinc-900">{t("login.email")}</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        <label className="mt-5 block text-base font-medium text-zinc-900">{t("login.password")}</label>
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full cursor-pointer rounded-md bg-black px-4 py-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t("login.submitting") : t("login.submit")}
        </button>
        <div className="mt-4 flex items-center justify-between text-base">
          <Link href="/forgot-password" className="text-black underline">
            {t("login.forgotPassword")}
          </Link>
          <Link href="/register" className="text-black underline">
            {t("login.register")}
          </Link>
        </div>
      </form>
    </main>
  );
}

function LoginLoadingFallback() {
  const t = useT();
  return <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">{t("common.loading")}</main>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
